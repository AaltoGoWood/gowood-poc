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
    error::ZomeApiError,
};
use hdk::holochain_core_types::{
    entry::Entry,
    dna::entry_types::Sharing,
    signature::Provenance,
    signature::Signature,
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

// #[derive(Serialize, Deserialize, Debug, DefaultJson,Clone)]
// pub struct SignedKey {
//     sub: String, 
//     key: String,
//     sig: String,
// }

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

    
    #[zome_fn("hc_public")]
    fn create_signed_key_from_value(value: AssetsIdentity) -> ZomeApiResult<String> {
        let entry = Entry::App("assets_identity".into(), value.into());
        let address = hdk::commit_entry(&entry)?;
        let encrypted_address = hdk::encrypt(address).unwrap();
        let sig = hdk::sign(&encrypted_address).unwrap();

        let sub = hdk::AGENT_ADDRESS.to_string();
        let combined_key = format!("{}.{}.{}", sub, encrypted_address, sig);
        Ok(combined_key)
    }

    #[zome_fn("hc_public")]
    fn get_value_from_signed_key(key: String) -> ZomeApiResult<Option<Entry>> {
        let parts: Vec<&str> = key.split(".").collect();
        match &parts[..] { 
            [sub, key, sig] => {
                let address: Address = Address::from(sub.to_string());
                let signature = Signature::from(sig.to_string());
                let key_provenance = Provenance::new(address, signature);
                let verify_result = hdk::verify_signature(key_provenance, &key.to_string());
                if verify_result.is_ok() && verify_result.unwrap() {
                    let address = hdk::decrypt(key.to_string()).map(Address::from).unwrap();
                    hdk::get_entry(&address)
                } else {
                    let e = ZomeApiError::Internal("invalid signature".into());
                    std::result::Result::Err(e)
                }
            }
            _ => {
                let e = ZomeApiError::Internal("invalid signature".into());
                std::result::Result::Err(e)
            }
        }
    }


}
