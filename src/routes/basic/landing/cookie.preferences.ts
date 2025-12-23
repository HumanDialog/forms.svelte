import { writable } from 'svelte/store';
import {localStorageSave, localStorageRead} from '$lib'

export const cookies_saved_at = writable( localStorageRead('cookies_saved_at') )
cookies_saved_at.subscribe( (value) => { localStorageSave('cookies_saved_at', value) });

export const cookies_valid_until = writable( localStorageRead('cookies_valid_until') )
cookies_valid_until.subscribe( (value) => { localStorageSave('cookies_valid_until', value) });

export const cookies_allow_essential = writable( localStorageRead('cookies_allow_essential', 'true') )
cookies_allow_essential.subscribe( (value) => { localStorageSave('cookies_allow_essential', value) });

export const cookies_allow_preferences = writable( localStorageRead('cookies_allow_preferences') )
cookies_allow_preferences.subscribe( (value) => { localStorageSave('cookies_allow_preferences', value) });

export const cookies_allow_analytics = writable( localStorageRead('cookies_allow_analytics')  )
cookies_allow_analytics.subscribe( (value) => { localStorageSave('cookies_allow_analytics', value) });

export const cookies_allow_marketing = writable( localStorageRead('cookies_allow_marketing') )
cookies_allow_marketing.subscribe( (value) => { localStorageSave('cookies_allow_marketing', value) });