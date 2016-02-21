Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/* @providesModule HgConstants */

/**
 * These are status codes used by Mercurial's output.
 * Documented in http://selenic.com/hg/help/status.
 */

var _StatusCodeIdToNumber;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var StatusCodeId = {
  ADDED: 'A',
  CLEAN: 'C',
  IGNORED: 'I',
  MODIFIED: 'M',
  MISSING: '!', // (deleted by non-hg command, but still tracked)
  REMOVED: 'R',
  UNTRACKED: '?'
};

/**
 * Internally, the HgRepository uses the string StatusCodeId to do bookkeeping.
 * However, GitRepository uses numbers to represent its statuses, and returns
 * statuses as numbers. In order to keep our status 'types' the same, we map the
 * string StatusCodeId to numbers.
 * The numbers themselves should not matter; they are meant to be passed
 * to ::isStatusNew/::isStatusModified to be interpreted.
 */

var StatusCodeNumber = {
  ADDED: 1,
  CLEAN: 2,
  IGNORED: 3,
  MODIFIED: 4,
  MISSING: 5,
  REMOVED: 6,
  UNTRACKED: 7
};

var StatusCodeIdToNumber = (_StatusCodeIdToNumber = {}, _defineProperty(_StatusCodeIdToNumber, StatusCodeId.ADDED, StatusCodeNumber.ADDED), _defineProperty(_StatusCodeIdToNumber, StatusCodeId.CLEAN, StatusCodeNumber.CLEAN), _defineProperty(_StatusCodeIdToNumber, StatusCodeId.IGNORED, StatusCodeNumber.IGNORED), _defineProperty(_StatusCodeIdToNumber, StatusCodeId.MODIFIED, StatusCodeNumber.MODIFIED), _defineProperty(_StatusCodeIdToNumber, StatusCodeId.MISSING, StatusCodeNumber.MISSING), _defineProperty(_StatusCodeIdToNumber, StatusCodeId.REMOVED, StatusCodeNumber.REMOVED), _defineProperty(_StatusCodeIdToNumber, StatusCodeId.UNTRACKED, StatusCodeNumber.UNTRACKED), _StatusCodeIdToNumber);

var HgStatusOption = {
  ONLY_NON_IGNORED: 1, // only the output of `hg status`
  ONLY_IGNORED: 2, // only the output of `hg status --ignored`
  ALL_STATUSES: 3 };

// the output of `hg status --all`

module.exports = {
  HgStatusOption: HgStatusOption,
  StatusCodeId: StatusCodeId,
  StatusCodeIdToNumber: StatusCodeIdToNumber,
  StatusCodeNumber: StatusCodeNumber
};

// List of bookmarks at this revision.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhnLWNvbnN0YW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxJQUFNLFlBQWdELEdBQUc7QUFDdkQsT0FBSyxFQUFFLEdBQUc7QUFDVixPQUFLLEVBQUUsR0FBRztBQUNWLFNBQU8sRUFBRSxHQUFHO0FBQ1osVUFBUSxFQUFFLEdBQUc7QUFDYixTQUFPLEVBQUUsR0FBRztBQUNaLFNBQU8sRUFBRSxHQUFHO0FBQ1osV0FBUyxFQUFFLEdBQUc7Q0FDZixDQUFDOzs7Ozs7Ozs7OztBQVdGLElBQU0sZ0JBQXdELEdBQUc7QUFDL0QsT0FBSyxFQUFFLENBQUM7QUFDUixPQUFLLEVBQUUsQ0FBQztBQUNSLFNBQU8sRUFBRSxDQUFDO0FBQ1YsVUFBUSxFQUFFLENBQUM7QUFDWCxTQUFPLEVBQUUsQ0FBQztBQUNWLFNBQU8sRUFBRSxDQUFDO0FBQ1YsV0FBUyxFQUFFLENBQUM7Q0FDYixDQUFDOztBQUVGLElBQU0sb0JBQXVFLHVFQUMxRSxZQUFZLENBQUMsS0FBSyxFQUFHLGdCQUFnQixDQUFDLEtBQUssMENBQzNDLFlBQVksQ0FBQyxLQUFLLEVBQUcsZ0JBQWdCLENBQUMsS0FBSywwQ0FDM0MsWUFBWSxDQUFDLE9BQU8sRUFBRyxnQkFBZ0IsQ0FBQyxPQUFPLDBDQUMvQyxZQUFZLENBQUMsUUFBUSxFQUFHLGdCQUFnQixDQUFDLFFBQVEsMENBQ2pELFlBQVksQ0FBQyxPQUFPLEVBQUcsZ0JBQWdCLENBQUMsT0FBTywwQ0FDL0MsWUFBWSxDQUFDLE9BQU8sRUFBRyxnQkFBZ0IsQ0FBQyxPQUFPLDBDQUMvQyxZQUFZLENBQUMsU0FBUyxFQUFHLGdCQUFnQixDQUFDLFNBQVMseUJBQ3JELENBQUM7O0FBR0YsSUFBTSxjQUFvRCxHQUFHO0FBQzNELGtCQUFnQixFQUFFLENBQUM7QUFDbkIsY0FBWSxFQUFFLENBQUM7QUFDZixjQUFZLEVBQUUsQ0FBQyxFQUNoQixDQUFDOzs7O0FBdUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixnQkFBYyxFQUFkLGNBQWM7QUFDZCxjQUFZLEVBQVosWUFBWTtBQUNaLHNCQUFvQixFQUFwQixvQkFBb0I7QUFDcEIsa0JBQWdCLEVBQWhCLGdCQUFnQjtDQUNqQixDQUFDIiwiZmlsZSI6ImhnLWNvbnN0YW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbi8qIEBwcm92aWRlc01vZHVsZSBIZ0NvbnN0YW50cyAqL1xuXG5pbXBvcnQgdHlwZSB7TnVjbGlkZVVyaX0gZnJvbSAnLi4vLi4vcmVtb3RlLXVyaSc7XG5cbi8qKlxuICogVGhlc2UgYXJlIHN0YXR1cyBjb2RlcyB1c2VkIGJ5IE1lcmN1cmlhbCdzIG91dHB1dC5cbiAqIERvY3VtZW50ZWQgaW4gaHR0cDovL3NlbGVuaWMuY29tL2hnL2hlbHAvc3RhdHVzLlxuICovXG5leHBvcnQgdHlwZSBTdGF0dXNDb2RlSWRWYWx1ZSA9ICdBJyB8ICdDJyB8ICdJJyB8ICdNJyB8ICchJyB8ICdSJyB8ICc/JztcbmNvbnN0IFN0YXR1c0NvZGVJZDoge1trZXk6IHN0cmluZ106IFN0YXR1c0NvZGVJZFZhbHVlfSA9IHtcbiAgQURERUQ6ICdBJyxcbiAgQ0xFQU46ICdDJyxcbiAgSUdOT1JFRDogJ0knLFxuICBNT0RJRklFRDogJ00nLFxuICBNSVNTSU5HOiAnIScsIC8vIChkZWxldGVkIGJ5IG5vbi1oZyBjb21tYW5kLCBidXQgc3RpbGwgdHJhY2tlZClcbiAgUkVNT1ZFRDogJ1InLFxuICBVTlRSQUNLRUQ6ICc/Jyxcbn07XG5cbi8qKlxuICogSW50ZXJuYWxseSwgdGhlIEhnUmVwb3NpdG9yeSB1c2VzIHRoZSBzdHJpbmcgU3RhdHVzQ29kZUlkIHRvIGRvIGJvb2trZWVwaW5nLlxuICogSG93ZXZlciwgR2l0UmVwb3NpdG9yeSB1c2VzIG51bWJlcnMgdG8gcmVwcmVzZW50IGl0cyBzdGF0dXNlcywgYW5kIHJldHVybnNcbiAqIHN0YXR1c2VzIGFzIG51bWJlcnMuIEluIG9yZGVyIHRvIGtlZXAgb3VyIHN0YXR1cyAndHlwZXMnIHRoZSBzYW1lLCB3ZSBtYXAgdGhlXG4gKiBzdHJpbmcgU3RhdHVzQ29kZUlkIHRvIG51bWJlcnMuXG4gKiBUaGUgbnVtYmVycyB0aGVtc2VsdmVzIHNob3VsZCBub3QgbWF0dGVyOyB0aGV5IGFyZSBtZWFudCB0byBiZSBwYXNzZWRcbiAqIHRvIDo6aXNTdGF0dXNOZXcvOjppc1N0YXR1c01vZGlmaWVkIHRvIGJlIGludGVycHJldGVkLlxuICovXG5leHBvcnQgdHlwZSBTdGF0dXNDb2RlTnVtYmVyVmFsdWUgPSAxIHwgMiB8IDMgfCA0IHwgNSB8IDYgfCA3O1xuY29uc3QgU3RhdHVzQ29kZU51bWJlcjoge1trZXk6IHN0cmluZ106IFN0YXR1c0NvZGVOdW1iZXJWYWx1ZX0gPSB7XG4gIEFEREVEOiAxLFxuICBDTEVBTjogMixcbiAgSUdOT1JFRDogMyxcbiAgTU9ESUZJRUQ6IDQsXG4gIE1JU1NJTkc6IDUsXG4gIFJFTU9WRUQ6IDYsXG4gIFVOVFJBQ0tFRDogNyxcbn07XG5cbmNvbnN0IFN0YXR1c0NvZGVJZFRvTnVtYmVyOiB7W2tleTogU3RhdHVzQ29kZUlkVmFsdWVdOiBTdGF0dXNDb2RlTnVtYmVyVmFsdWV9ID0ge1xuICBbU3RhdHVzQ29kZUlkLkFEREVEXTogU3RhdHVzQ29kZU51bWJlci5BRERFRCxcbiAgW1N0YXR1c0NvZGVJZC5DTEVBTl06IFN0YXR1c0NvZGVOdW1iZXIuQ0xFQU4sXG4gIFtTdGF0dXNDb2RlSWQuSUdOT1JFRF06IFN0YXR1c0NvZGVOdW1iZXIuSUdOT1JFRCxcbiAgW1N0YXR1c0NvZGVJZC5NT0RJRklFRF06IFN0YXR1c0NvZGVOdW1iZXIuTU9ESUZJRUQsXG4gIFtTdGF0dXNDb2RlSWQuTUlTU0lOR106IFN0YXR1c0NvZGVOdW1iZXIuTUlTU0lORyxcbiAgW1N0YXR1c0NvZGVJZC5SRU1PVkVEXTogU3RhdHVzQ29kZU51bWJlci5SRU1PVkVELFxuICBbU3RhdHVzQ29kZUlkLlVOVFJBQ0tFRF06IFN0YXR1c0NvZGVOdW1iZXIuVU5UUkFDS0VELFxufTtcblxuZXhwb3J0IHR5cGUgSGdTdGF0dXNPcHRpb25WYWx1ZSA9IDEgfCAyIHwgMztcbmNvbnN0IEhnU3RhdHVzT3B0aW9uOiB7W2tleTogc3RyaW5nXTogSGdTdGF0dXNPcHRpb25WYWx1ZX0gPSB7XG4gIE9OTFlfTk9OX0lHTk9SRUQ6IDEsICAvLyBvbmx5IHRoZSBvdXRwdXQgb2YgYGhnIHN0YXR1c2BcbiAgT05MWV9JR05PUkVEOiAyLCAgICAgIC8vIG9ubHkgdGhlIG91dHB1dCBvZiBgaGcgc3RhdHVzIC0taWdub3JlZGBcbiAgQUxMX1NUQVRVU0VTOiAzLCAgICAgIC8vIHRoZSBvdXRwdXQgb2YgYGhnIHN0YXR1cyAtLWFsbGBcbn07XG5cbmV4cG9ydCB0eXBlIExpbmVEaWZmID0ge1xuICBvbGRTdGFydDogbnVtYmVyO1xuICBvbGRMaW5lczogbnVtYmVyO1xuICBuZXdTdGFydDogbnVtYmVyO1xuICBuZXdMaW5lczogbnVtYmVyO1xufTtcblxuZXhwb3J0IHR5cGUgRGlmZkluZm8gPSB7XG4gIGFkZGVkOiBudW1iZXI7XG4gIGRlbGV0ZWQ6IG51bWJlcjtcbiAgbGluZURpZmZzOiBBcnJheTxMaW5lRGlmZj47XG59O1xuXG5leHBvcnQgdHlwZSBSZXZpc2lvbkluZm8gPSB7XG4gIGlkOiBudW1iZXI7XG4gIGhhc2g6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgYXV0aG9yOiBzdHJpbmc7XG4gIGRhdGU6IERhdGU7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIC8vIExpc3Qgb2YgYm9va21hcmtzIGF0IHRoaXMgcmV2aXNpb24uXG4gIGJvb2ttYXJrczogQXJyYXk8c3RyaW5nPjtcbn07XG5cbmV4cG9ydCB0eXBlIFJldmlzaW9uRmlsZUNvcHkgPSB7XG4gIGZyb206IE51Y2xpZGVVcmk7XG4gIHRvOiBOdWNsaWRlVXJpO1xufTtcblxuZXhwb3J0IHR5cGUgUmV2aXNpb25GaWxlQ2hhbmdlcyA9IHtcbiAgYWxsOiBBcnJheTxOdWNsaWRlVXJpPjtcbiAgYWRkZWQ6IEFycmF5PE51Y2xpZGVVcmk+O1xuICBkZWxldGVkOiBBcnJheTxOdWNsaWRlVXJpPjtcbiAgY29waWVkOiBBcnJheTxSZXZpc2lvbkZpbGVDb3B5PjtcbiAgbW9kaWZpZWQ6IEFycmF5PE51Y2xpZGVVcmk+O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEhnU3RhdHVzT3B0aW9uLFxuICBTdGF0dXNDb2RlSWQsXG4gIFN0YXR1c0NvZGVJZFRvTnVtYmVyLFxuICBTdGF0dXNDb2RlTnVtYmVyLFxufTtcbiJdfQ==