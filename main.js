// ### Usability enhancements via JS
/* The intention here is to make the experience more pleasant with JS,
   but still have the site usable without it. This is also why we're
   attaching all listeners dynamically. */

// --- Clicking on scroll hints skips to the next page (and only indicate this is JS is present)

function scrollToSelector(selector) {
    const el = document.querySelector(selector);
    el.scrollIntoView({ behavior: 'smooth' });
}

document.querySelector('#js-attach-scroll-wid')
    .addEventListener('click', () => scrollToSelector('#what-i-do-wrapper'));
document.querySelector('#js-attach-scroll-whtf')
    .addEventListener('click', () => scrollToSelector('#where-to-find-wrapper'));
document.querySelectorAll('.scroll-hint')
    .forEach((el) => el.classList.add('click-hint'));

// --- Scrolling parallax is terminated early for smoother experience
const SCROLLING_DOWN = 'SCROLLING_DOWN';
const SCROLLING_DOWN_DONE = 'SCROLLING_DOWN_DONE';
const SCROLLING_UP_PENDING = 'SCROLLING_UP_PENDING';
const SCROLLING_UP = 'SCROLLING_UP';
const IN_COOLDOWN = 'IN_COOLDOWN';

/*    This makes the parallax scrolling experience smoother: Browsers induce a noticeable
      delay between finishing to scroll the child and switching to scrolling the parent.
      We combat this by forcing scroll switching manually. */
class ParallaxHandler {
    constructor(el) {
        this.el = el;
        this.previousScrollTop = 0;
        this.state = SCROLLING_DOWN;
        this.scrollUpsInARow = 0;
    }

    attachListeners() {
        this.scrollRoomAvailable = Math.abs(this.el.scrollHeight - this.el.clientHeight);
        // Once widely supported, we could also consider if the
        // 'scrollend' event could help us:
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event
        this.el.addEventListener('scroll', () => this.onScroll());
        this.el.addEventListener('click', () => scrollToSelector('#parallax-top'))
    }

    onScroll() {
        this.onScrollInternal();
        // console.info('scroll state', this.state);
    }

    onScrollInternal() {
        // Important context: 'scroll' events are usually
        // delivered best-effort, and we might miss the 'last' scroll.
        // If this doesn't work on 'slower' devices, we need to add some
        // re-checking using setTimeout / requestAnimationFrame.
        if (this.state === IN_COOLDOWN) {
            return;
        }

        this.checkScrollingUp();
        if (this.state === SCROLLING_UP_PENDING) {
            return;
        } else if (this.state === SCROLLING_UP) {
            this.state = IN_COOLDOWN;
            scrollToSelector('#parallax-top');
            window.setTimeout(() => this.state = SCROLLING_DOWN, 200);
            return;
        }

        this.checkScrollingDown();
        if (this.state === SCROLLING_DOWN_DONE) {
            this.state = IN_COOLDOWN;
            this.previousScrollTop = 0;

            // Chrome doesn't seem to like scrollIntoView() here, also
            // not via various indirections. It works in a click handler
            // though. Firefox supports it just fine but OK.
            // if (!chrome) scrollToSelector('#what-i-do-wrapper');
            const root = document.querySelector(':root');
            root.scrollTo({
                'top': this.el.offsetHeight,
                'behavior': 'smooth',
            });
            // ^ Also, this doesn't hit the spot exactly in Chrome, it seems
            // like the user's scroll events are queded during smooth scrolling,
            // which Firefox (imo correctly) ignores them.
            window.setTimeout(() => {
                this.el.scrollTop = 0; // for if user returns back up
            }, 500);
            window.setTimeout(() => {
                this.state = SCROLLING_DOWN;
            }, 2500);
        }
    }

    checkScrollingUp() {
        let negativeProgressMade = this.el.scrollTop < this.previousScrollTop;
        if (negativeProgressMade) {
            this.scrollUpsInARow++;
            if (this.scrollUpsInARow < 5) {
                this.state = SCROLLING_UP_PENDING;
            } else {
                this.state = SCROLLING_UP;
            }
        } else {
            this.scrollUpsInARow = 0;
        }
        this.previousScrollTop = this.el.scrollTop;
    }

    checkScrollingDown() {
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled·
        const scrollRoomLeftPx = Math.abs(
            this.el.scrollHeight - this.el.clientHeight - this.el.scrollTop
        );
        const progressFrac = scrollRoomLeftPx / this.scrollRoomAvailable;
        // 0.25 is PERFECT in Firefox, but Chrome seems to compute
        // heights differently and needs more like 0.5 ...
        if (progressFrac < 0.25 || scrollRoomLeftPx < 1 /* px */) {
            this.state = SCROLLING_DOWN_DONE;
        }
    }
}


const handler = new ParallaxHandler(
    document.querySelector('#js-attach-parallax-fastlane')
);
window.setTimeout(() => handler.attachListeners());
