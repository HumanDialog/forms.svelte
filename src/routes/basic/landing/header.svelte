
<script lang="ts">
    import AppIcon from '../appicon.svelte'
    import { link } from 'svelte-spa-router';
    import {Authorized, NotAuthorized, signInHRef, signOutHRef, signUpHRef } from '@humandialog/auth.svelte'
    import {i18n} from '$lib'

    export let main = false;
    export let light = false;
    export let transparent = false
    export let hide_links = false

    export let theme = 'slate'

    $: setup_colors()

    let background = ''
    let brand_color = '';
    let hero_color = '';
    let text_color = '';

   
    function setup_colors()
    {
        switch(theme)
        {
        case 'slate':
            brand_color = light ? 'text-slate-700' : 'text-slate-200'
            hero_color = light ? 'text-slate-500' : 'text-slate-400'
            text_color = light ? 'text-slate-700 hover:text-slate-900' : 'text-slate-200 hover:text-slate-500'
            background = transparent ? '' : (light ? 'bg-slate-200' : 'bg-slate-900')
            break;

        case 'stone':
            brand_color = light ? 'text-stone-700' : 'text-stone-200'
            hero_color = light ? 'text-stone-500' : 'text-stone-400'
            text_color = light ? 'text-stone-700 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200'
            background = transparent ? '' : (light ? 'bg-stone-200' : 'bg-stone-900')
            break;
        }
    }

</script>

<nav class= "{background} font-semibold text-xs sm:text-sm leading-6">
    <div class="max-w-screen-xl flex flex-col sm:flex-row items-center justify-between mx-auto p-4">
      <a href="/" class="" use:link aria-label="Home page">
            <div class="flex flex-row">
                <AppIcon class="block w-6 h-6 sm:w-10 sm:h-10"/>
                <span class="ml-2 sm:ml-4 sm:mt-1">
                    <span class="font-semibold text-base sm:text-2xl {brand_color}">Octopus</span>
                    <span class=" text-xs sm:text-xl font-normal {hero_color}"> | <span>
                        _;
                        A minimalist workspace for tasks and notes;
                        Un espacio de trabajo minimalista para tareas y notas;
                        Minimalistyczna aplikacja do zadań i notatek </span>
                    </span>
                </span>
            </div>
      </a>
       <div class="px-4 w-full block sm:w-auto">
            {#if !hide_links}
                <ul class="flex flex-row pt-3  items-center justify-between mx-auto space-x-2 sm:space-x-12 mt-0 border-0 border-gray-700">
                    {#if main}
                        <NotAuthorized>
                            <li><a class="block rounded md:bg-transparent p-0 {text_color}" use:link href='/blog'>Blog</a></li>
                        </NotAuthorized>
                        <NotAuthorized>
                            <li><a class="block rounded md:bg-transparent p-0 {text_color}" href='https://github.com/HumanDialog/octopus.basic.reef'>_; Source code; Código fuente; Kod źródłowy</a></li>
                        </NotAuthorized>
                        <NotAuthorized>
                            <li><a class="block rounded md:bg-transparent p-0 {text_color}" use:link href={$signUpHRef}>_; Get started; Empieza; Rozpocznij</a></li>
                        </NotAuthorized>
                        <NotAuthorized>
                            <li><a class="block  rounded md:bg-transparent p-0 {text_color}" use:link href={$signInHRef}>_; Sign In; Iniciar sesión; Zaloguj</a></li>
                        </NotAuthorized>
                        
                    {:else}
                        <Authorized>
                            <li><a class="block  rounded md:bg-transparent p-0 {text_color}" use:link href='/'>App</a></li>
                        </Authorized>
                    {/if}
                </ul>
            {/if}
        </div>
    
    </div>
  </nav>
