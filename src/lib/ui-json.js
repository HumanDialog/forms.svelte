
import {writable, get, derived} from 'svelte/store';
import {SCREEN_SIZES, randomString} from './utils.js'
import {navGetKey, localStorageSave, localStorageRead, hasLocalStorage, sessionStorageSave, sessionStorageRead} from './utils.js'
import { location } from 'svelte-spa-router';

export const sample_data_tick_store = writable(1);
export const sample_contextItemsStore = writable({focused:'', data: null, sel: null, props: null})

//query body where root is an item and we display single collection
export function query_item_collection(item_expressions, collection, element_expressions)
{
    return {Id: 1,
            Name: "collector",
            ExpandLevel: 3,
            Tree:
            [
                {
                    Id: 1,
                    Association: '',
                    Expressions: item_expressions,
                    SubTree:
                    [
                        {
                            Id: 2,
                            Association: collection,
                            //Filter: 'State <> STATE_FINISHED',
                            Sort: "Order",
                            Expressions: element_expressions
                        }
                    ]
                }
            ]
        }
}
