import {writable, get} from 'svelte/store';
import {reef} from '@humandialog/auth.svelte/dist/index'
import {onErrorShowAlert} from './stores.js'
import {i18n} from './i18n.js'


let last_logged_item = null;
let last_logget_property = '';

const modified_item_store = writable(null);

export function setjItemProperty(item, field_name, value)
{
    //console.log('setjItemProperty ' + field_name)
    
    if(item[field_name] == value)
        return
    
    let type_name = item.$type;
    item[field_name] = value;
    informModification(item, field_name, type_name);
}

export function set_ritem_property(item, field_name, value)
{
    //console.log('setjItemProperty ' + field_name)
    let type_name = item.$type;
    item[field_name] = value;
    informModification(item, field_name, type_name);
    //pushChanges()
}

export function informModification(itm, field_name, type_name=undefined)
{
    if(type_name == undefined)
    {
        if(itm.$type)
            type_name = itm.$type;
        else if(itm.oclType)
            type_name = itm.oclType;
        else if(itm.$ref)
        {
            let segments = itm.$ref.split('/')
            type_name = segments[1];
        }
        else
        {
            console.error ("informModification no type")

            return false;
        }
    }

    let item_entry = {
        Id: type_name + itm.Id,
        type_name: type_name,
        item: { [type_name]:
                {
                    Id: itm.Id,
                    [field_name]: itm[field_name],

                    ... (itm.$ver) ? {$ver: itm.$ver} : {}
                } },
        item_reference: itm.$ver ? itm : null
    };

    modified_item_store.set(item_entry);
    return true;
};

export function informModificationEx(typeName, itm, attribName, attribValue)
{
    let item_entry = {
        Id: typeName + itm.Id,
        type_name: typeName,
        item: { [typeName]:
                {
                    Id: itm.Id,
                    [attribName]: attribValue,
                    ... (itm.$ver) ? {$ver: itm.$ver} : {}
                } },
        item_reference: itm.$ver ? itm : null
    };

    modified_item_store.set(item_entry);
    return true;
}

export function hasModifications()
{
    //console.log('hasModifications', modified_items_map.size)
    return modified_items_map.size > 0
}

export function informItem(itm, type_name=undefined)
{
    if(type_name == undefined)
    {
        if(itm.$type)
            type_name = itm.$type;
        else if(itm.oclType)
            type_name = itm.oclType;
        else if(itm.$ref)
        {
            let segments = itm.$ref.split('/')
            type_name = segments[1];
        }
        else
            return false;
    }

    let item_entry = {
        Id: type_name + itm.Id,
        type_name: type_name,
        item: { [type_name]:
                itm },
        item_reference: itm.$ver ? itm : null
    };

    modified_item_store.set(item_entry);
    return true;
};

const update_request_ticket = writable(0);
let last_update_ticket = 0;
let afterPushCallbacks = []

export function pushChanges(afterPushCallback=undefined)
{
    if(!modified_items_map.size)
        return;

    if(afterPushCallback)
        afterPushCallbacks.push(afterPushCallback);

    update_request_ticket.update(n => n + 1);
}

export function xpushChanges(afterPushCallback=undefined)
{
}


const modified_items_map = new Map();
modified_item_store.subscribe((mod_item) => {
    if(mod_item)
    {
        if(modified_items_map.has(mod_item.Id))
        {
            let last_itm = modified_items_map.get(mod_item.Id);

            let last_mods = last_itm.item[last_itm.type_name];
            let curr_mods = mod_item.item[mod_item.type_name];
            Object.keys(curr_mods).forEach(prop_name => {
                last_mods[prop_name] = curr_mods[prop_name];
            });

            if(mod_item.item_reference)
                last_itm.item_reference = mod_item.item_reference
        }
        else
        {
            modified_items_map.set(mod_item.Id, mod_item);
        }
        unsavedModificationsTicket.set( get(unsavedModificationsTicket) + 1 )
    }
});

export const unsavedModificationsTicket = writable(0);

update_request_ticket.subscribe(async (v) => {
    flushChanges(v)
})

export async function pushChangesImmediately()
{
    if(!modified_items_map.size)
        return;

    const ticket = get(update_request_ticket) + 1
    await flushChanges(ticket);

    update_request_ticket.set(ticket)
}

async function flushChanges(ticket)
{
    if(ticket != last_update_ticket)
    {
        last_update_ticket = ticket;

        if(!modified_items_map.size)
            return;

        let changes = [];
        modified_items_map.forEach((value, key) =>
        {
            changes.push(value.item);
        });


        /*
        const res = await reef.post('/Push', { Items: changes }, onErrorShowAlert);

        //if(res)
        //{
            modified_items_map.clear();
        //}
        */

        let path = reef.correct_path_with_api_version_if_needed('/Push')

        try {
            console.info(path)
            console.info(JSON.stringify( { Items: changes } ))

            let res = await reef.fetch(path, {
                method: 'POST',
                body: JSON.stringify( { Items: changes } )
            })
            if (res.ok) {

                await handle_push_items_response(res)

                modified_items_map.clear();
                unsavedModificationsTicket.set( get(unsavedModificationsTicket) + 1 )

                afterPushCallbacks.forEach( cb => cb())
                afterPushCallbacks = []
            }
            else
            {
                console.error(path)
                console.error(JSON.stringify( { Items: changes } ))

                let err = ''

                switch(res.status)
                {
                case 400:               // basic exception like access rights
                    modified_items_map.clear();
                    unsavedModificationsTicket.set( get(unsavedModificationsTicket) + 1 )

                    afterPushCallbacks.forEach( cb => cb())
                    afterPushCallbacks = []

                    err = await res.text()
                    console.error(err)
                    onErrorShowAlert(err)
                    break;

                case 409:               // conflict. Bad version of item
                    modified_items_map.clear();
                    unsavedModificationsTicket.set( get(unsavedModificationsTicket) + 1 )

                    afterPushCallbacks.forEach( cb => cb())
                    afterPushCallbacks = []

                    err = i18n({en: 'Incorrect version of the object', es: 'Versión incorrecta del objeto', pl: 'Nieprawidłowa wersja obiektu'})
                    onErrorShowAlert(err, true) // reload = true
                    break;

                default:
                    err = await res.text()
                    console.error(err)
                    onErrorShowAlert(err)
                    break;
                }

                
                
                
            }
        }
        catch (err) {
            console.error(err);
            onErrorShowAlert(err)
        }

    }
} 


async function handle_push_items_response(response)
{
    if(!response.body)
        return

    try 
    {
        const json = await response.json()
        if(json.Changes)
        {
            json.Changes.forEach(ch => {
                Object.keys(ch).forEach(type_name => {
                    const modified_item = ch[type_name]
                    if(modified_item && modified_item.$ver)
                    {
                        const update_map_key = type_name + modified_item.Id
                        if(modified_items_map.has(update_map_key))
                        {
                            let mod_entry = modified_items_map.get(update_map_key);
                            if( mod_entry.item_reference && 
                                mod_entry.item_reference.$ver && 
                                mod_entry.item_reference.Id == modified_item.Id &&
                                mod_entry.item_reference.$type == type_name)
                            {
                                mod_entry.item_reference.$ver = modified_item.$ver
                                mod_entry.item_reference = null
                            }
                        }
            
                    }
                })
            })
        }
    }
    catch(err)
    {
        //console.error(err)
    }
}