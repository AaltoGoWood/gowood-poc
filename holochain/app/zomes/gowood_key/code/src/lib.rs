#![feature(proc_macro_hygiene)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_json_derive;
// #[macro_use] 
// extern crate log;

use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
};
use hdk::holochain_core_types::{
    entry::Entry,
    dna::entry_types::Sharing,
};

use hdk::holochain_json_api::{
    json::JsonString,
    error::JsonError
};

use hdk::holochain_persistence_api::{
    cas::content::Address
};

use hdk_proc_macros::zome;

// see https://developer.holochain.org/api/0.0.38-alpha14/hdk/ for info on using the hdk library

// This is a sample zome that defines an entry type "MyEntry" that can be committed to the
// agent's chain via the exposed function create_my_entry

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct GowoodAsset {
    asset_type: String,
    id: String,
}

#[zome]
mod gowood_key_zome {

    #[init]
    fn init() {
        let _foo = hdk::debug(">>>>TESTING.INIT>>>>>");
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[entry_def]
     fn my_entry_def() -> ValidatingEntryType {
        let _foo = hdk::debug(">>>>TESTING.my_entry_def>>>>>");
        entry!(
            name: "gowood_asset",
            description: "this is a same entry defintion",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<GowoodAsset>| {
                let _foo = hdk::debug(">>>>TESTING.validation>>>>>");
                Ok(())
            }
        )
    }

    #[zome_fn("hc_public")]
    fn create_key_for_value(value: GowoodAsset) -> ZomeApiResult<Address> {
        let _foo = hdk::debug(">>>>TESTING.create_key_for_value>>>>>");
        let entry = Entry::App("gowood_asset".into(), value.into());
        let address = hdk::commit_entry(&entry)?;
        Ok(address)
    }

    #[zome_fn("hc_public")]
    fn get_value_from_key(address: Address) -> ZomeApiResult<Option<Entry>> {
        let _foo = hdk::debug(">>>>TESTING.get_value_from_key>>>>>");
        hdk::get_entry(&address)
    }

}
