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

#[derive(Serialize, Deserialize, Debug, DefaultJson,Clone)]
pub struct AssetsIdentity {
    r#type: String,
    id: String,
}

#[zome]
mod my_zome {

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[entry_def]
     fn my_entry_def() -> ValidatingEntryType {
        entry!(
            name: "assets_identity",
            description: "this is a same entry defintion",
            sharing: Sharing::Private,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<AssetsIdentity>| {
                Ok(())
            }
        )
    }

    #[zome_fn("hc_public")]
    fn create_key_from_value(value: AssetsIdentity) -> ZomeApiResult<String> {
        let entry = Entry::App("assets_identity".into(), value.into());
        let address = hdk::commit_entry(&entry)?;
        let encrypted_address = hdk::encrypt(address).unwrap();
        Ok(encrypted_address)
    }

    #[zome_fn("hc_public")]
    fn get_value_from_key(key: String) -> ZomeApiResult<Option<Entry>> {
        let address = hdk::decrypt(key).map(Address::from).unwrap();
        hdk::get_entry(&address)
    }

}
