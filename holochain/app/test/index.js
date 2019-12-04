const { Orchestrator, Config } = require('@holochain/tryorama')

const dnaGowoodKey = Config.dna(__dirname + '/../dist/holochain.dna.json', 'gowood_key');
const dneFile = require('../dist/holochain.dna.json')

// Set up a Conductor configuration using the handy `Conductor.config` helper.
// Read the docs for more on configuration.
const mainConfig = Config.gen(
  {
    gowood_key: dnaGowoodKey,  // agent_id="plywood", instance_id="plywood", dna=dnaPlywood
  },
  {
    // specify a bridge from chat to blog
    // bridges: [Config.bridge('bridge-name', 'chat', 'blog')],
    // use a sim2h network (see conductor config options for all valid network types)
    // network: {
    //   type: 'sim2h',
    //   sim2h_url: 'ws://localhost:9000',
    // },
    // etc., any other valid conductor config items can go here
  }
)

process.on('unhandledRejection', error => {
   // Will print "unhandledRejection err is not defined"
   console.error('got unhandledRejection:', error);
});

const orchestrator = new Orchestrator()

orchestrator.registerScenario("description of example test", async (s, t) => {

  const { gowood_key } = await s.players({gowood_key: mainConfig })
  await gowood_key.spawn()
  // Make a call to a Zome function
  // indicating the function, and passing it an input
  const addr = await gowood_key.call("gowood_key", "gowood_key", "create_key_for_value ", {"value" : { "type":"plywood", "id": "p123" }})

  // Wait for all network activity to
  await s.consistency()

  const result = await gowood_key.call("gowood_key", "gowood_key", "get_value_from_key ", {"key": addr.Ok})

  // check for equality of the actual and expected results
  t.deepEqual(result, { Ok: { App: [ 'asset_identity', '{"type":"plywood", "id": "p123" }' ] } })
})

orchestrator.run()
  .then(res => {
    console.log(res);
  });
