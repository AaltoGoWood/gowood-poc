(ns ogre.core
  (:require [clojurewerkz.ogre.core :refer [open-graph traversal traverse
                                            match out has in select into-seq!
                                            values as by V __] :as ogre]
            ;;[potemkin :as po]
            )
  (:import (org.apache.tinkerpop.gremlin.process.traversal Compare Operator Order P Pop SackFunctions$Barrier Scope Traversal)
           (org.apache.tinkerpop.gremlin.structure Graph T Column VertexProperty$Cardinality Vertex)
           (org.apache.tinkerpop.gremlin.structure.util GraphFactory)
           (org.apache.tinkerpop.gremlin.structure.util.empty EmptyGraph)
           (org.apache.tinkerpop.gremlin.process.traversal.dsl.graph GraphTraversal GraphTraversalSource)
           (org.apache.tinkerpop.gremlin.driver.remote DriverRemoteConnection))
  (:gen-class))

(defn -main
  "I don't do a whole lot ... yet."
  [& args]
  (println "Hello, World!"))

;; IN MEMORY DB GREMLIN TINKER GRAPH. EASIEST TO TEST FIRST
(def tinker-graph (open-graph {(Graph/GRAPH)
                               (.getName org.apache.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph)}))

(defn generate-toy-graph-into!
  "Generate the graph in createModern() into an existing graph"
  [graph]
  (org.apache.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory/generateModern graph))

(defn test-gremlin-tinkergraph []
  (generate-toy-graph-into! tinker-graph)
  (let [g (traversal tinker-graph)]
    (traverse g V (match
                   (__ (as :a) (out :created) (as :b))
                   (__ (as :b) (has :name "lop"))
                   (__ (as :b) (in :created) (as :c))
                   (__ (as :c) (has :age 29)))
              (select :a :c) (by :name)
              (into-seq!))))

(defn test-janus-graph []
  (let [graph (EmptyGraph/instance)
        g (.withRemote (traversal graph) "conf/remote-graph.properties")]
    (traverse g V (values :name)
                      (into-seq!))))
