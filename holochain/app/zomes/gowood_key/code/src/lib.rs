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

use std::collections::HashMap;

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
pub struct Asset {
    r#type: String,
    id: String,
    attributes: HashMap<String, String>,
    rows: Vec<String>,
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
            name: "asset",
            description: "this is a same entry definition",
            sharing: Sharing::Private,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<Asset>| {
                Ok(())
            }
        )
    }

    #[receive]
    fn receive_callback(_from: Address, key: String) -> String {
        let address = hdk::decrypt(key.to_string()).map(Address::from).unwrap();
        hdk::get_entry(&address).map(|entry| JsonString::from(entry).to_string()).unwrap()
    }

    #[zome_fn("hc_public")]
    fn create_key_from_value(value: Asset) -> ZomeApiResult<String> {
        let entry = Entry::App("asset".into(), value.into());
        let address = hdk::commit_entry(&entry)?;
        let encrypted_address = hdk::encrypt(address).unwrap();
        Ok(encrypted_address)
    }

    #[zome_fn("hc_public")]
    fn get_value_from_key(key: String) -> ZomeApiResult<Option<Entry>> {
        // TODO: This should take signature as parameter and validate 
        // it before fetching result
        let address = hdk::decrypt(key).map(Address::from).unwrap();
        hdk::get_entry(&address)
    }

    
    #[zome_fn("hc_public")]
    fn create_signed_key_from_value(value: Asset) -> ZomeApiResult<String> {
        // Store entry to local DHT
        let entry = Entry::App("asset".into(), value.into());
        let address = hdk::commit_entry(&entry)?;

        // encrypt entry key and sign address + key token
        let sub = hdk::AGENT_ADDRESS.to_string();
        let encrypted_address = hdk::encrypt(address).unwrap();
        let address_and_entry = format!("{}.{}", &sub, encrypted_address);
        let sig = hdk::sign(address_and_entry).unwrap();
        
        // create signed token
        let combined_key = format!("{}.{}.{}", sub, encrypted_address, sig);
        Ok(combined_key)
    }

    #[zome_fn("hc_public")]
    fn get_value_from_signed_key(key: String) -> ZomeApiResult<Option<Entry>> {
        let parts: Vec<&str> = key.split(".").collect();
        match &parts[..] { 
            [sub, key, sig] => {
                // Validate signature
                let agent_address: Address = Address::from(sub.to_string());
                let signature = Signature::from(sig.to_string());
                let address_and_entry = format!("{}.{}", sub, key);
                let key_provenance = Provenance::new(agent_address, signature);
                let verify_result = hdk::verify_signature(key_provenance, address_and_entry);
                let is_signature_valid = verify_result.is_ok() && verify_result.unwrap();

                // Try to get entry if signature is valid
                let is_this_agent = &sub.to_string() == &hdk::AGENT_ADDRESS.to_string();
                if is_signature_valid && is_this_agent {
                    let address = hdk::decrypt(key.to_string()).map(Address::from).unwrap();
                    hdk::get_entry(&address)
                } else if is_signature_valid && !is_this_agent  {
                    let address: Address = Address::from(sub.to_string());
                    let response_json: String = hdk::send(address, key.to_string(), 5000.into()).unwrap();
                    let entry: Entry = serde_json::from_str(r#response_json.as_ref()).unwrap();
                    Ok(Some(entry))
                } else {
                    let e = ZomeApiError::Internal("invalid signature".into());
                    std::result::Result::Err(e)
                }
            }
            _ => {
                let e = ZomeApiError::Internal("invalid key".into());
                std::result::Result::Err(e)
            }
        }
    }


}
