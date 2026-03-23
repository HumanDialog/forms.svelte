
import { navGetKey, navHide, navIsVisible, navShow, navToggle, isDeviceSmallerThan } from './utils';
import {dark_mode_store, reloadWholeApp, tools_visible_store, bottom_bar_visible_store, leftHandedFAB, showFABAlways, dont_hide_FAB_when_on_screen_keyboard_visible} from './stores'
import {session, signInHRef, signOutHRef} from '@humandialog/auth.svelte'
import {setCurrentLanguage, getLanguages, i18n, getCurrentLanguage} from './i18n.js'
import {get} from 'svelte/store'
import {push} from 'svelte-spa-router'

export function get_settings_menu(appConfig, mainToolbarConfig = undefined)
{
    let config
    let has_selection_details
    let selection_detils_caption =  i18n({en: 'Properties', es: 'Propiedades', pl: 'Właściwości'});

    if(appConfig)
    {
        config = appConfig.mainToolbar;
        has_selection_details = appConfig.selectionDetails;

        if(has_selection_details)
        {
            if(appConfig.selectionDetails.captionFunc)
                selection_detils_caption = appConfig.selectionDetails.captionFunc()
            else if(appConfig.selectionDetails.caption)
                selection_detils_caption = appConfig.selectionDetails.caption

        }
    }
    else
    {
        has_selection_details = false;
        config = mainToolbarConfig;
    }

    const is_logged_in = get(session).isActive;
    const show_sign_in_out_icons = config.signin ? true : false;
    const sign_in_href = get(signInHRef);
    const sign_out_href = get(signOutHRef);


    //////////////////////////////////////////////////////////////////////////////////////

    let options = [];

    if(config.customOperations && Array.isArray(config.customOperations) && config.customOperations.length > 0)
    {
        config.customOperations.forEach( o => {
            let add = true;
            if(o.condition)
                add = o.condition();

            if(add)
            {
                let caption = ''
                if(o.captionFunc)
                    caption = o.captionFunc()
                else if(o.caption)
                    caption = o.caption

                options.push({
                                caption: caption,
                                icon: o.icon,
                                mricon: o.mricon,
                                action: o.action,
                                menu: o.menu
                            })
            }
        })
    }

    if(show_sign_in_out_icons)
    {
            if(!is_logged_in)
            {
                options.push({
                    caption: i18n( { en: 'Sign in', es: 'Iniciar sesión', pl: 'Zaloguj'}),
                    mricon: 'log-in',
                    action: (focused) => { push(sign_in_href) }
                });
            }
            else
            {
                options.push({
                    caption: i18n({en: 'Sign out', es: 'Cerrar sesión', pl: 'Wyloguj' }) ,
                    mricon: 'log-out',
                    action: (focused) => { push(sign_out_href) }
                });
            }

            options.push({separator: true})
    }

    if(!config || config.darkMode)
    {
        const capt = i18n({en: 'Dark mode', es: 'Modo oscuro', pl: 'Tryb ciemny'})
        if(get(dark_mode_store) == '')
        {
            options.push( {
                    caption: capt,
                    mricon: 'sun-moon',
                    action: (focused) => { dark_mode_store.set('dark'); }
                });
        }
        else
        {
            options.push( {
                    caption: capt,
                    mricon: 'sun-moon',
                    action: (focused) => { dark_mode_store.set(''); }
                });
        }
    }

        const langs = getLanguages()
        if(langs && langs.length > 1)
        {
            const langMenu = langs.map( l => ({
                caption: l.name,
                img: l.flag,
                action: (b) => {setCurrentLanguage(l); reloadWholeApp()},
                disabled: getCurrentLanguage() == l
            }))

            options.push( {
                caption: i18n({en: 'Language', es:'Idioma', pl:'Język'}),
                menu: langMenu,               
                mricon: 'languages',
            })
        }

        if(config && config.operations)
        {
            const tools_visible = get(tools_visible_store)
            options.push( {
                    caption: i18n({en:'Toolbar', es:'Barra de herramientas', pl:'Pasek narzędzi'}),
                    toggle: tools_visible,
                    action: (focused) => { tools_visible_store.set( !tools_visible) }
                });
        }

        let show_fab_always = false
        if(!isDeviceSmallerThan("sm"))
        {
            show_fab_always = get(showFABAlways)
            options.push({
                caption: i18n({en: 'Floating buttons', es: 'Botones flotantes', pl: 'Pływające przyciski'}),
                toggle: show_fab_always,
                action: (f) => { showFABAlways.set(!show_fab_always); }
            })
        }
        else
            show_fab_always = true;

        const left_handed_fab = get(leftHandedFAB)
        options.push({
            caption: i18n({en: 'Left-handed mode', es: 'Modo para zurdos', pl: 'Tryb dla leworęcznych'}),
            toggle: left_handed_fab,
            disabled: !show_fab_always,
            action: (f) => { leftHandedFAB.set(!left_handed_fab); }
        })
        
        const dont_hide_FAB = get(dont_hide_FAB_when_on_screen_keyboard_visible)
        options.push({
            caption: i18n({en: 'Hide the tools while typing', es: 'Guarda las herramientas mientras escribes', pl: 'Chowaj narzędzia w czasie pisania'}),
            toggle: !dont_hide_FAB,
            disabled: !show_fab_always,
            action: (f) => { dont_hide_FAB_when_on_screen_keyboard_visible.set(!dont_hide_FAB); }
        })


        if(has_selection_details)
        {
            const bottom_bar_visible = get(bottom_bar_visible_store)
            options.push( {
                        caption: selection_detils_caption,
                        toggle: bottom_bar_visible,
                        action: (focused) => { bottom_bar_visible_store.set(!bottom_bar_visible) }
                    });
        }

    return options
}

