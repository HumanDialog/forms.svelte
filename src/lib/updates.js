import {writable, get} from 'svelte/store';
import {reef} from '@humandialog/auth.svelte/dist/index'
import {onErrorShowAlert} from './stores.js'


let last_logged_item = null;
let last_logget_property = '';

const modified_item_store = writable(null);

export function setjItemProperty(item, field_name, value)
{
    console.log('setjItemProperty ' + field_name)
    
    if(item[field_name] == value)
        return
    
    let type_name = item.$type;
    item[field_name] = value;
    informModification(item, field_name, type_name);
}

export function set_ritem_property(item, field_name, value)
{
    console.log('setjItemProperty ' + field_name)
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
        Id: [type_name] + itm.Id,
        type_name: type_name,
        item: { [type_name]:
                {
                    Id: itm.Id,
                    [field_name]: itm[field_name]
                } },
    };

    modified_item_store.set(item_entry);
    return true;
};

export function informModificationEx(typeName, itemId, attribName, attribValue)
{
    let item_entry = {
        Id: [typeName] + itemId,
        type_name: typeName,
        item: { [typeName]:
                {
                    Id: itemId,
                    [attribName]: attribValue
                } },
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
        Id: [type_name] + itm.Id,
        type_name: type_name,
        item: { [type_name]:
                itm },
    };

    modified_item_store.set(item_entry);
    return true;
};

const update_request_ticket = writable(0);
let last_update_ticket = 0;
let afterPushCallbacks = []

export function pushChanges(afterPushCallback=undefined)
{
    //console.trace()

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
    if(v != last_update_ticket)
    {
        last_update_ticket = v;

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

                modified_items_map.clear();
                unsavedModificationsTicket.set( get(unsavedModificationsTicket) + 1 )

                afterPushCallbacks.forEach( cb => cb())
                afterPushCallbacks = []
            }
            else
            {
                console.error(path)
                console.error(JSON.stringify( { Items: changes } ))
                if(res.status == 400)   // basic exception like access rights
                {
                    modified_items_map.clear();
                    unsavedModificationsTicket.set( get(unsavedModificationsTicket) + 1 )

                    afterPushCallbacks.forEach( cb => cb())
                    afterPushCallbacks = []
                }

                const err = await res.text()

                console.error(err)
                onErrorShowAlert(err)
            }
        }
        catch (err) {
            console.error(err);
            onErrorShowAlert(err)
        }

    }
})
