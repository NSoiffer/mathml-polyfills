/***
 * Handles the "subscriptshift" and "superscriptshift" attributes on
 * msub, msup, and msubsup elements.
 ***/
/* -*- Mode: Java; tab-width: 4; indent-tabs-mode:nil; c-basic-offset: 4 -*- */
/* vim: set ts=4 et sw=4 tw=80: */
/*
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

import { _MathTransforms, convertToPx, getDimensions, MATHML_NS } from '../common/math-transforms.js'

/**
 * 
 * @param {HTMLElement} element
 */
const transformSubscriptShift = (element) => {
  // Wrap mpadded around subscript of msub/msubsup to shift it vertically. The spec says the attribute
  //   "specifies the minimum amount to shift the baseline of subscript down"
  //  
  // To do this, we look at where it would be without the shift,
  // and then pad it by the amount specified in the subscriptshift or superscriptshift attribute taking
  // into account the default shift.
  // Note: finding the baseline is tricky, so we use the top of the bounding box. If the baseline shifts by 'x', so does the top.
  let base = element.children[0];
  let script = element.children[1];
  console.log(`\n\nelement: ${element.outerHTML}\nbase: ${base.outerHTML}\nscript: ${script.outerHTML}`);
  let baseBBox = base.getBoundingClientRect();
  console.log(`base BBox y, height: (${baseBBox.y}, ${baseBBox.height})`);
  let scriptBBox = script.getBoundingClientRect();
  console.log(`script BBox y, height: (${scriptBBox.y}, ${scriptBBox.height})`);
  let baseDimensions = getDimensions(base);
  console.log(`baseDimensions: ${JSON.stringify(baseDimensions)}`);
  let scriptDimensions = getDimensions(script);
  console.log(`scriptDimensions: ${JSON.stringify(scriptDimensions)}`);
  let baseBaseline = base.getBoundingClientRect().y + baseDimensions.height;
  let scriptBaseline = script.getBoundingClientRect().y + scriptDimensions.height;
  let scriptShift = scriptBaseline - baseBaseline
  let shiftAttr = convertToPx(element, element.getAttribute('subscriptshift'));
  let amountToPad = shiftAttr - scriptShift; 
  console.log(`amountToPad: ${amountToPad}, scriptShift: ${scriptShift}, shiftAttr: ${shiftAttr}`);
  if (amountToPad > 0) {
    let mpadded = document.createElementNS(MATHML_NS, "mpadded");
    mpadded.setAttribute("height", `${scriptDimensions.height + amountToPad}px`); // relative shift not in core
    mpadded.setAttribute("voffset", `-${amountToPad}px`);
    element.replaceChild(mpadded, script);
    mpadded.appendChild(script);
    console.log(`element after append=${element.outerHTML}`);
  }

  return element;
}

const transformSuperscriptShift = (script) => {
}

_MathTransforms.add('msub[subscriptshift]', transformSubscriptShift);
_MathTransforms.add('msup[superscriptshift]', transformSuperscriptShift);
_MathTransforms.add('msubsup[subscriptshift]', transformSubscriptShift);
_MathTransforms.add('msubsup[superscriptshift]', transformSuperscriptShift);
