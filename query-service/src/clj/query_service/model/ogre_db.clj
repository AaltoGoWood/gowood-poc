(ns query-service.model.ogre-db
  (:require
   [clojure.edn :as edn]
   [clojurewerkz.ogre.core :refer [open-graph traversal traverse value-map
                                   match out has in select into-seq!
                                   values as by V __] :as ogre])
  (:import (org.apache.tinkerpop.gremlin.process.traversal Compare Operator Order P Pop SackFunctions$Barrier Scope Traversal)
           (org.apache.tinkerpop.gremlin.structure Graph T Column VertexProperty$Cardinality Vertex)
           (org.apache.tinkerpop.gremlin.structure.util GraphFactory)
           (org.apache.tinkerpop.gremlin.structure.util.empty EmptyGraph)
           (org.apache.tinkerpop.gremlin.process.traversal.dsl.graph GraphTraversal GraphTraversalSource)
           (org.apache.tinkerpop.gremlin.driver.remote DriverRemoteConnection)
           (org.apache.tinkerpop.gremlin.driver Cluster Cluster$Builder))
  (:gen-class))

(defn- attr->keyword [k]
  (case k
    "node-id" :id
    "node-type" :type
    (keyword k)))

(defn- parse-coords [coordStr]
  (let [[lng lat] (clojure.string/split coordStr #",[ ]?")]
    (if (and lng lat)
      {:lng (edn/read-string lng) :lat (edn/read-string lat) }
      nil
      )
    ))

(declare normalize-object)
(defn- normalize-value [k v]
  (cond
    (= k "coords") (parse-coords (first v))
    (or (vector? v)
        (instance? java.util.ArrayList v)) (first v)
    (instance? org.apache.tinkerpop.gremlin.process.traversal.step.util.BulkSet v)
    (vec (map normalize-object v))
    (instance? java.util.LinkedHashMap v)
    (normalize-object v)
    :else v))
; (normalize-value "coords" ["1, 2"])

(defn normalize-object [obj]
  (cond
    (and (instance? java.util.Optional obj) (not (.isPresent obj))) nil
    (and (instance? java.util.Optional obj) (.isPresent obj)) (normalize-object (.get obj))
    :else (into {} (map (fn [[k vl]] [(attr->keyword k) (normalize-value k vl)]) obj))))

; (normalize-value "coord" ["1, 2"])
; (normalize-value "foo" ["bar"])
; (normalize-value "foo"
;                  #{{"node-id" ["p125"], "node-type" ["plywood"]}
;                    {"node-id" ["p124"], "node-type" ["plywood"]}
;                    {"node-id" ["p123"], "node-type" ["plywood"]}})

; (normalize-object {"node-id" ["746103"], "node-type" ["building"] "foobar" ["fkk"]})

(defn get-graph []
  (let [conf-file-url ^java.net.URL (clojure.java.io/resource "conf/remote-objects.yaml")
        conf-file (.getPath conf-file-url)
        driverConnection (DriverRemoteConnection/using conf-file "g")
        graph (EmptyGraph/instance)
        g (.withRemote (traversal graph) driverConnection)]
    g))

(defn reset-graph []
  (let [g (get-graph)]
    (-> g V (ogre/drop) (.iterate))))

(defn count-V []
  (let [g (get-graph)]
    (or
     (first (traverse g V (.count) (ogre/into-vec!)))
     0)))


(defn count-E []
  (let [g (get-graph)]
    (or
     (first (traverse g ogre/E (.count) (ogre/into-vec!)))
     0)))

(defn- entity [acc type id & [props]]
  (-> acc
      (.addV type)
      (ogre/property  "node-id" id)
      (ogre/property "node-type" type)
      (#(reduce (fn [acc, [k, v]] (ogre/property acc k v))
                %
                (or props {})))
       (ogre/as (str type "/" id))))

(defn- composed-of [acc fromNode toNode]
  (-> acc
      (.addE "composed-of")
      (.from fromNode)
      (.to toNode)))

(defn init-poc-graph []
  (let [g (get-graph)]
    ;; (reset-graph)
    (-> g
        (entity "building" "746103")
        (entity "plywood" "p123" {"producer" "UPM Plywood"})
        (entity "plywood" "p124" {"producer" "UPM Plywood"})
        (entity "plywood" "p125" {"producer" "UPM Plywood"})
        (entity "tree-trunk" "p123-1"  {"speciesOfTree" "Pine"
                                        "trunkWidth" 75
                                        "timestamp" "2019-10-14T09:12:13.012Z"
                                        "length" 20
                                        "coords" "25.474273614, 65.0563745" })
        (entity "tree-trunk" "p123-2" {"speciesOfTree" "Pine"
                                       "trunkWidth" 60
                                       "timestamp" "2019-10-12T09:12:13.012Z"
                                       "length" 30
                                       "coords" "25.474293614, 65.0543745"})
        (entity "tree-trunk" "p124-1" {"speciesOfTree" "Pine"
                                        "trunkWidth" 60
                                        "timestamp" "2019-10-11T09:10:13.012Z"
                                        "length" 25
                                        "coords" "25.474243614, 65.0503745"})
        (entity "tree-trunk" "p125-1" {"speciesOfTree" "Pine"
                                       "trunkWidth" 60
                                       "timestamp" "2019-10-11T09:10:13.012Z"
                                       "length" 25
                                       "coords" "25.484243614, 65.0503645"})
        (composed-of "building/746103" "plywood/p123")
        (composed-of "building/746103" "plywood/p124")
        (composed-of "building/746103" "plywood/p125")
        (composed-of "plywood/p123" "tree-trunk/p123-1")
        (composed-of "plywood/p123" "tree-trunk/p123-2")
        (composed-of "plywood/p124" "tree-trunk/p124-1")
        (composed-of "plywood/p125" "tree-trunk/p125-1")
        (.next))))

(defn get-nodes []
  (let [g (get-graph)]
    (traverse g V
      (ogre/value-map)
      (ogre/into-vec!))))

(defn get-node-with-components [node-type node-id]
  (let [g (get-graph)]
    (->
     (traverse g V
               (ogre/has node-type "node-id" node-id)
               (ogre/as :attributes)
               (ogre/optional (__ (out) (ogre/value-map) (ogre/aggregate :row)))
               (ogre/project "attributes" "rows")
               (ogre/by (__ (select :attributes) (ogre/value-map)))
               (ogre/by (__ (select :row)))
               (.tryNext))
     normalize-object)))

;  (get-node-with-components "building" "746103")

(defn get-edges []
  (let [g (get-graph)]
    (traverse g ogre/E
      (ogre/into-vec!))))

(defn apply-command [op body]
  (let [{{id :id type :type} :from} body
        data (get-node-with-components type id)
        found? (some? data)
        ]
    (println (str "orge -> id: " id "; type: " type "; found " found?))
    {:req {:op op :body body}
     :result {:found found?
              :data data}
     :external-nodes []}))

(apply-command nil {:from {:id "749103" :type "building"}})



;; IN MEMORY DB GREMLIN TINKER GRAPH. EASIEST TO TEST FIRST
; (def tinker-graph (open-graph {(Graph/GRAPH)
;                                (.getName org.apache.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph)}))

; (defn generate-toy-graph-into!
;   "Generate the graph in createModern() into an existing graph"
;   [graph]
;   (org.apache.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory/generateModern graph))

; (defn test-gremlin-tinkergraph []
;   (generate-toy-graph-into! tinker-graph)
;   (let [g (traversal tinker-graph)]
;     (traverse g V (match
;                    (__ (as :a) (out :created) (as :b))
;                     (__ (as :b) (has :name "lop"))
;                     (__ (as :b) (in :created) (as :c))
;                     (__ (as :c) (has :age 29)))
;               (select :a :c) (by :name)
;               (into-seq!))))
