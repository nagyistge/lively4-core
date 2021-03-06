
/*
 * Methods for traversing and transforming tree structures.
 */
;(function(exports) {
"use strict";

var tree = exports.tree = {

  prewalk: function(treeNode, iterator, childGetter) {
    iterator(treeNode);
    (childGetter(treeNode) || []).forEach(function(ea) {
      tree.prewalk(ea, iterator, childGetter); });
  },

  postwalk: function(treeNode, iterator, childGetter) {
    (childGetter(treeNode) || []).forEach(function(ea) {
      tree.postwalk(ea, iterator, childGetter); });
    iterator(treeNode);
  },

  detect: function(treeNode, testFunc, childGetter) {
    // Traverses a `treeNode` recursively and returns the first node for which
    // `testFunc` returns true. `childGetter` is a function to retrieve the
    // children from a node.
    if (testFunc(treeNode)) return treeNode;
    var found;
    exports.arr.detect(childGetter(treeNode) || [],
      function(ea) { return found = tree.detect(ea, testFunc, childGetter); });
    return found;
  },

  filter: function(treeNode, testFunc, childGetter) {
    // Traverses a `treeNode` recursively and returns all nodes for which
    // `testFunc` returns true. `childGetter` is a function to retrieve the
    // children from a node.
    var result = [];
    if (testFunc(treeNode)) result.push(treeNode);
    return result.concat(
      exports.arr.flatten((childGetter(treeNode) || []).map(function(n) {
        return tree.filter(n, testFunc, childGetter); })));
  },

  map: function(treeNode, mapFunc, childGetter, depth) {
    // Traverses a `treeNode` recursively and call `mapFunc` on each node. The
    // return values of all mapFunc calls is the result. `childGetter` is a
    // function to retrieve the children from a node.
    depth = depth || 0;
    var result = [mapFunc(treeNode, depth)];
    return result.concat(
      exports.arr.flatten((childGetter(treeNode) || []).map(function(n) {
        return tree.map(n, mapFunc, childGetter, depth); })));
  },

  mapTree: function(treeNode, mapFunc, childGetter, depth) {
    // Traverses the tree and creates a structurally identical tree but with
    // mapped nodes
    depth = depth || 0;
    var mappedNodes = (childGetter(treeNode) || []).map(function(n) {
      return tree.mapTree(n, mapFunc, childGetter, depth);
    })
    return mapFunc(treeNode, mappedNodes, depth);
  }

}

})(typeof require !== "undefined" && typeof exports !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
