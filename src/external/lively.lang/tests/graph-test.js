/*global beforeEach, afterEach, describe, it*/

var isNodejs = typeof module !== 'undefined' && typeof require !== 'undefined';
var Global = typeof window !== 'undefined' ? window : global;
var Global = isNodejs ? global : window;
var expect = Global.expect || require('expect.js');
var mocha = Global.mocha || require('mocha');
var lively = Global.lively || {}; lively.lang = lively.lang || require('../index');

var graph = lively.lang.graph;

describe('graph', function() {

  var testGraph = {
    "a": ["b", "c"],
    "b": ["c", "d", "e", "f"],
    "d": ["c", "f"],
    "e": ["a", "f"],
    "f": []
  }

  describe('hull', function() {

    it("can be computed", function() {
      expect(graph.hull(testGraph, "d")).to.eql(["c", "f"]);
      expect(graph.hull(testGraph, "e")).to.eql(['a', 'f', 'b', 'c', 'd', 'e']);
      expect(graph.hull(testGraph, "e", ["b"])).to.eql(["a", "f", "c"]);
      expect(graph.hull(testGraph, "e", [], 2)).to.eql(['a', 'f', 'b', 'c']);
    });

    it("reachable subgraph", function() {
      expect(graph.subgraphReachableBy(testGraph, "d", []))
        .to.eql({"d": ["c", "f"], "c": [], "f": []});
      expect(graph.subgraphReachableBy(testGraph, "e", [], 2))
        .to.eql({e: [ 'a', 'f' ], a: [ 'b', 'c' ], f: []});
      expect(graph.subgraphReachableBy(testGraph, "e", ["a"], 2))
        .to.eql({e: ['f' ], f: []});
    });

  });
  
  describe("invert", (arg) => {
    it("inverts references", () => {
      var g = {"a": ["b", "c"], "b": ["c"], "c": ["a"]},
          expected = {"a": ["c"], "b": ["a"], "c": ["a", "b"]};
      expect(graph.invert(g)).to.eql(expected);
    });
  });

  describe("reduce", () => {

    it("works", () => {
      var depGraph = {a: ["b", "c"],b: ["c"]},
          result = graph.reduce((akk, ea, i) => akk + ` ${ea} ${i}`, depGraph, "a", "");
      expect(result).to.equal(" a 0 b 1 c 2");
    });

  });

  describe("sort", () => {

    it("sorts into groups", () => {
      var depGraph = {a: ["b", "c"], b: ["c"], c: ["b"]};
      expect(graph.sortByReference(depGraph, "a")).to.eql([["c"], ["b"], ["a"]]);
    });

  });

});
