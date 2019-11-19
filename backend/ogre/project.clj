(defproject ogre "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [clojurewerkz/ogre "3.4.2.0"]
                 [org.apache.tinkerpop/tinkergraph-gremlin "3.4.2"]
                 [org.apache.tinkerpop/gremlin-driver "3.4.2"]
                 [org.janusgraph/janusgraph-core "0.4.0"]]

  :main ^:skip-aot ogre.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
