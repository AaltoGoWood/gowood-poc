const { Orchestrator, Config } = require('@holochain/tryorama')

const dnaPlywood = Config.dna(__dirname + '/../dist/holochain.dna.json', 'plywood');
const dneFile = require('../dist/holochain.dna.json')

// Set up a Conductor configuration using the handy `Conductor.config` helper.
// Read the docs for more on configuration.
const mainConfig = Config.gen(
  {
    plywood: dnaPlywood,  // agent_id="plywood", instance_id="plywood", dna=dnaPlywood
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

  const { plywood } = await s.players({plywood: mainConfig })
  await plywood.spawn()
  // Make a call to a Zome function
  // indicating the function, and passing it an input
  const addr = await plywood.call("plywood", "plywood", "create_my_entry", {"entry" : {"content":"sample content"}})

  // Wait for all network activity to
  await s.consistency()

  const result = await plywood.call("plywood", "plywood", "get_my_entry", {"address": addr.Ok})

  // check for equality of the actual and expected results
  t.deepEqual(result, { Ok: { App: [ 'my_entry', '{"content":"sample content"}' ] } })
})

orchestrator.run()
  .then(res => {
    console.log(res);
  });
