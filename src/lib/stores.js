
import {writable, get} from 'svelte/store';

export const data_tick_store = writable(1);
export const context_items_store = writable({focused:'', data: null, sel: null})
export const context_info_store = writable({data: '', sel: ''})
export const context_types_store = writable({focused:'', data: null, sel: null})