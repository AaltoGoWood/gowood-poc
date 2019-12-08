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

// see https://docs.rs/holochain_core_types/0.0.38-alpha14/holochain_core_types/#modules  for info on using the hdk library

/* ****************************
 *  Types                    *
 **************************** */

/// Asset represent an entity that can be traversed
/// 
/// ## Notes
/// 
/// - links to other assets are stored as tokens not as holochain links. The reason to this is that we did
///   not have time to implement other kind of access control and implement proper DPKI for assets.
#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Asset {
    r#type: String,
    id: String,
    attributes: HashMap<String, String>,
    rows: Vec<String>,
}


#[derive(Debug)]
pub enum ValidationResult {
    /// Valid and value decrypted 
    /// Valid(asset_key)
    Valid(Address),
    /// Valid but this agent cannot decrypt value
    /// ValidEncrypted(other_agent_id, token)
    ValidEncrypted(Address, String),
    /// Token was invalidate
    /// Either format was wrong or signature was incorrect
    Invalid,
} 

/* ****************************
 *  Helpers                   *
 **************************** */

/// Verify asset token of layout ```agent_id.encrypted_asset_id.signature```
///
/// ## Returns
/// 
/// - `Valid (Address)` if token was valid and agent was able to encrypt the Address of asset.
/// - `ValidEncrypted(Address, String)` if token was valid but agent was now able to encrypt the key. 
///    Address is address of agent that is able to encrypt the token and fetch data.
/// - `Invalid` is token was invalid or signature was invalid
fn verify_token(token: &String) -> ValidationResult {
    let parts: Vec<&str> = token.split(".").collect();
    match &parts[..] { 
        [sub, key, sig] => {
            let agent_address: Address = Address::from(sub.to_string());
            let signature = Signature::from(sig.to_string());
            let address_and_entry = format!("{}.{}", sub, key);
            let key_provenance = Provenance::new(agent_address.clone(), signature);

            let verify_result = hdk::verify_signature(key_provenance, address_and_entry);
            let is_signature_valid = verify_result.is_ok() && verify_result.unwrap();

            let is_this_agent = &sub.to_string() == &hdk::AGENT_ADDRESS.to_string();
            if is_signature_valid && is_this_agent {
                let address = hdk::decrypt(key.to_string()).map(Address::from).unwrap();
                ValidationResult::Valid(address)
            } else if is_signature_valid && !is_this_agent {
                ValidationResult::ValidEncrypted(agent_address, token.to_string())
            } else {
                ValidationResult::Invalid
            }
        }
        _ => ValidationResult::Invalid
    }
}
fn new_error<T>(error: &str) -> ZomeApiResult<T>  {
    let e = ZomeApiError::Internal(error.into());
    Err(e)
}

/// Try to unwrap JsonString from an entry of type ZomeApiResult<Some<App(AppEntryType, JsonString)>> 
/// and then parse JsonString into type T.
/// 
/// ## Returns
/// 
/// - `Ok(T)` if entry is not correct type or JsonString cannot be parsed to T return Err.
/// - `Err('entry not found')` if entry was ZomeApiResult::Ok(None)
/// - `Err('entry found but not Entry::App')` if entry was not type of ZomeApiResult<Some<App(AppEntryType, JsonString)>>
/// - `Err('entry found but but not convertible to T')` if entry of type ZomeApiResult<Some<App(AppEntryType, JsonString)>> found 
///    but JsonString cannot be covert to T
fn unwrap_entry_as<T: serde::de::DeserializeOwned>(entry: ZomeApiResult<Option<Entry>>) -> ZomeApiResult<T> {
    match entry {
        ZomeApiResult::Ok(None) => {
            new_error("entry not found")
        }
        // Entry value is wrapped in App
        ZomeApiResult::Ok(Some(Entry::App(_t, json))) => { 
            let asset : Result<T, _> = serde_json::from_str(r#json.to_string().as_ref());
            match asset {
                Ok(a) => { 
                    Ok(a) 
                }
                _ => new_error("entry found but but not convertible to T")
            }
        }
        _ => {
            new_error("entry found but not Entry::App")
        }
    }
}

/* ****************************
 *  Define Zome               *
 **************************** */

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
    fn receive_callback(_from: Address, token: String) -> String {
        match verify_token(&token) { 
            ValidationResult::Valid(address) => {
                let entry = hdk::get_entry(&address);
                let result: ZomeApiResult<Asset> = unwrap_entry_as(entry);
                JsonString::from(result).to_string()
            }
            _ => {
                let error: ZomeApiResult<Asset> = new_error::<Asset>("entry not found");
                JsonString::from(error).to_string()
            }
        }
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
        let address = hdk::decrypt(key).map(Address::from).unwrap();
        hdk::get_entry(&address)
    }

    
    #[zome_fn("hc_public")]
    fn create_signed_token_for_value(value: Asset) -> ZomeApiResult<String> {
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
    fn get_value_from_signed_token(token: String) -> ZomeApiResult<Asset> {
        match verify_token(&token) { 
            ValidationResult::Valid(address) => {
                let entry = hdk::get_entry(&address);
                return unwrap_entry_as(entry);
            }
            ValidationResult::ValidEncrypted(other_address, token) => {
                let response_json: String = hdk::send(other_address, token, 5000.into()).unwrap();
                let maybe_entry : Result<Asset, _> = serde_json::from_str(r#response_json.as_ref()).unwrap();
                maybe_entry
            }
            _ => {
                let e = ZomeApiError::Internal("invalid key".into());
                Err(e)
            }
        }
    }
}
