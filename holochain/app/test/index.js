const { Orchestrator, Config } = require('@holochain/tryorama')

const dnaGowoodKey = Config.dna(__dirname + '/../dist/holochain.dna.json', 'gowood_key');

// Set up a Conductor configuration using the handy `Conductor.config` helper.
// Read the docs for more on configuration.
const mainConfig = Config.gen(
  {
    gowood_key: dnaGowoodKey,  // agent_id="plywood", instance_id="plywood", dna=dnaPlywood
  },
  { logger: { 'type': 'debug' } }
)

process.on('unhandledRejection', error => {
   // Will print "unhandledRejection err is not defined"
   console.error('got unhandledRejection:', error);
});

const orchestrator = new Orchestrator()

orchestrator.registerScenario("test_1", async (s, t) => {

  const { gowood_key } = await s.players({gowood_key: mainConfig });
  await gowood_key.spawn()
  const addr = await gowood_key.call("gowood_key", 
     "gowood_key", 
     "create_key_from_value", 
      { "value" : { "type":"plywood", "id": "p123" }})


  await s.consistency()

  const result = await gowood_key.call("gowood_key", "gowood_key", "get_value_from_key", {"key": addr.Ok})

  t.deepEqual(result, { Ok: { App: [ 'assets_identity', '{"type":"plywood","id":"p123"}' ] } })
})

orchestrator.run()
  .catch(err => {
    console.error('>>> Test runner failed', JSON.stringify(err))
  })
  .then(res => {
    console.log('Test result', res);
  });
