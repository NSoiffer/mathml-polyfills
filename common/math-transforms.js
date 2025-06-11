// @ts-check
/* -*- Mode: Java; tab-width: 4; indent-tabs-mode:nil; c-basic-offset: 4 -*- */
/* vim: set ts=4 et sw=4 tw=80: */


export const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

/*
    A really basic implementation, this will be a module.
 */
  export const _MathTransforms = {
    _plugins: new Map(),
    _css: '',
    _createStyleSheet: str => {
      if (str.length !== _MathTransforms.cssKey) {    // always true the first time because _MathTransforms.cssKey is undefined
        _MathTransforms.cssKey = str.length;
        const style = document.createElement ( 'style' );
        style.textContent = str;
        document.head.appendChild ( style );
        _MathTransforms.styleSheet = style      // cached stylesheet
        document.head.removeChild ( style );
      }
      return _MathTransforms.styleSheet
    },

    getCSSStyleSheet: () => {const foo = _MathTransforms._createStyleSheet(_MathTransforms._css).cloneNode(true); 
    return foo; },

    transform: root => {
      for (const selector of _MathTransforms._plugins.keys()) {
        let transformer = _MathTransforms._plugins.get(selector);

        // find the matching elements..
        // this is problematic since you could add some
        let matches = Array.from(root.querySelectorAll(selector));

        // Since these are in tree-order, if we process them in reverse order (child first)
        // we should side-step the gnarliest of potential nesting issues
        matches.reverse().forEach(el => {
          let transformed = transformer(el);
          if (transformed && transformed !== el) {
            el.parentElement.replaceChild(transformed, el);
          }
        });
      }
    },
  
    add: (selector, cb, css='') => {
      _MathTransforms._plugins.set(selector, cb);
      _MathTransforms._css += css;
    }
  };


/**
 * Same as cloneNode(true) except that shadow roots are copied
 * If you are using the transforms and you need to clone a node that potentially has a shadowRoot, use this so the shadowRoot is copied
 * As of November, 2020, Elementary Math and Linebreaking transforms are the only transforms that have shadowRoots. 
 * @param {Element} el 
 * @param {Element} [clone] 
 * @returns {Element} -- the clone (only useful if function is called with one arg)
 */
export function cloneElementWithShadowRoot(el, clone) {
  if (clone === undefined) {
      clone = el.cloneNode(true);
  }

  // rather than clone each element and then the children, we're assuming cloning the whole tree is most efficient
  // however, we still need to search 'el' to check for a shadowRoot.
  if (el.shadowRoot) {
      let shadowRoot = clone.attachShadow({ mode: "open" });
      shadowRoot.appendChild(_MathTransforms.getCSSStyleSheet());
      for (let i = 0; i < el.shadowRoot.childElementCount; i++) {
        shadowRoot.appendChild( cloneElementWithShadowRoot(el.shadowRoot.children[i]) )
      }
  }

  for (let i = 0; i < el.childElementCount; i++) {
      cloneElementWithShadowRoot(el.children[i], clone.children[i]);
  }

  return clone;
}

/**
 * Converts a CSS length unit to pixels and returns that as a number
 * @param{Element} element
 * @param {string} length 
 * @returns {number}
 */
export function convertToPx(element, length) {
  // quick check to see if we have common case of 'px'
  if (/px/.test(length)) {
      return parseFloat(length);
  }

  let doComputation = (mspace) => {
    return mspace.getBoundingClientRect().depth;
  };
  return measureDimensions(element, length, doComputation);
}

/**
 * @param {HTMLElement} element
 * @returns {{width:number, height: number, depth: number}}
 */
export function getDimensions(element) {
    // IMPORTANT: 'element' must have a parent element (i.e., it should not be "math")
    const elementRect = element.getBoundingClientRect();
    let doComputation = (mspace) => {
      const mspaceRect = mspace.getBoundingClientRect();
      console.log(`elementRect: ${JSON.stringify(elementRect)}`);
      console.log(`mspaceRect: ${JSON.stringify(mspaceRect)}`);
      return {
          width: elementRect.width,
          height: mspaceRect.y - elementRect.top,
          depth: elementRect.bottom - mspaceRect.y
      };
    };
    return measureDimensions(element, '0px', doComputation);
}
/**
 * @param {HTMLElement} element
 * @param {string} length (CSS length unit, e.g., '1em', '2px', etc.)
 */
function measureDimensions(element, depth, doComputation) {
    // IMPORTANT: 'element' must have a parent element (i.e., it should not be "math")
    // Create an mrow around the children of 'element' and add an mspace with 'depth' to children of the mrow.
    // With 0 height, the mspace's y/top should be the baseline of the mrow,
    //   so it can be used to calculate the math's height/depth. 
    // Note: the mspace should not cause reflow, so the change/undo hopefully is somewhat efficient
    const mrow = document.createElementNS(MATHML_NS, 'mrow');
    const mspace = document.createElementNS(MATHML_NS, 'mspace')
    mspace.setAttribute('depth', depth);
    const clonedElement = cloneElementWithShadowRoot(element);
    for (let i = 0; i < clonedElement.children.length; i++) {
        mrow.appendChild(clonedElement.children[i]);    // removed from clone and added to mrow
    }
    mrow.appendChild(mspace);
    clonedElement.appendChild(mrow);
    element.parentElement.replaceChild(clonedElement, element);      // should not be reflow
    let answer = doComputation(mspace); // this will return the dimensions of the element
    clonedElement.parentElement.replaceChild(element, clonedElement);      // restore original structure; should not reflow
    return answer;
}