import {writable} from 'svelte/store';
import {reef} from '@humandialog/auth.svelte/dist/index'


const modified_item_store = writable(null);
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
            return false;
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
export function pushChanges()
{
    update_request_ticket.update(n => n + 1);
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
    }
});

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

        try
        {
            //console.log('push: ', changes);
            const res = await reef.post('/Push', { Items: changes });

            if(res)
            {
                modified_items_map.clear();
            }
        }
        catch(err)
        {
            console.error(err);
        }
    }
})
