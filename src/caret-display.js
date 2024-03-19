// This project is on hold while I see how far we can make it with the native cursor

// Got to get it out of the way. We need a whole file for the caret drawing logic.
// Let's create a caret object so that we can give it state.
// Let's make it a div element positioned relative to the text input
// Let's have an event-style system, where the caret gets events (or just functions calls) for things like
//  mouse-down, mouse-up, typing-key-down, etc
// Let's not track the cursor position in this file. We're obviously going to
//  hide the native cursor, but we can use it for true-position. This also
//  means we can re-use the browser's clicking and typing handling. So this file is 100% cursor display.
//      This does mean that we can't do multi-cursor out of the gate, but I'm fine with that.
// If I use the word "cursor" anywhere in this file, please correct it to "caret"

const DisplayCaret = {
    // -- public --

    // This input El is the source of truth for the location of the cursor. We just draw on top of it.
    init (inputEl) {
        this.inputEl = inputEl;
    }

    // You've moved the caret, either by pressing mouse-down or arrow keys
    moveCaret () {
        this.recalcPosition();
        this.resetTimeout();
    }

    // In the future, if we want to draw our own selection box, we can do that here
    // We might or might not want to display cursor display while you have a selection
    setSelection (isSelection) {

    }

    // -- private --

    recalcPosition () {
        // TODO: get selection point
        debugger;
        const pos = getCursorXY(this.inputEl, this.inputEl.getSe)
    }
};


/**
 * returns x, y coordinates for absolute positioning of a span within a given text input
 * at a given selection point
 * @param {object} input - the input element to obtain coordinates for
 * @param {number} selectionPoint - the selection point for the input
 */
function getCursorXY (input, selectionPoint) {
    const {
    offsetLeft: inputX,
    offsetTop: inputY,
    } = input
    // create a dummy element that will be a clone of our input
    const div = document.createElement('div')
    // get the computed style of the input and clone it onto the dummy element
    const copyStyle = getComputedStyle(input)
    for (const prop of copyStyle) {
    div.style[prop] = copyStyle[prop]
    }
    // we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
    const swap = '.'
    const inputValue = input.tagName === 'INPUT' ? input.value.replace(/ /g, swap) : input.value
    // set the div content to that of the textarea up until selection
    const textContent = inputValue.substr(0, selectionPoint)
    // set the text content of the dummy element div
    div.textContent = textContent
    if (input.tagName === 'TEXTAREA') div.style.height = 'auto'
    // if a single line input then the div needs to be single line and not break out like a text area
    if (input.tagName === 'INPUT') div.style.width = 'auto'
    // create a marker element to obtain caret position
    const span = document.createElement('span')
    // give the span the textContent of remaining content so that the recreated dummy element is as close as possible
    span.textContent = inputValue.substr(selectionPoint) || '.'
    // append the span marker to the div
    div.appendChild(span)
    // append the dummy element to the body
    document.body.appendChild(div)
    // get the marker position, this is the caret position top and left relative to the input
    const { offsetLeft: spanX, offsetTop: spanY } = span
    // lastly, remove that dummy element
    // NOTE:: can comment this out for debugging purposes if you want to see where that span is rendered
    document.body.removeChild(div)
    // return an object with the x and y of the caret. account for input positioning so that you don't need to wrap the input
    return {
        x: inputX + spanX,
        y: inputY + spanY,
    }
}
