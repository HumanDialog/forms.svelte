
<script lang="ts">
    import AppIcon from '../icons/tilos.icon.svelte'
    import { link } from 'svelte-spa-router';
    import {Authorized, NotAuthorized } from '@humandialog/auth.svelte'

    export let main = false;
    
</script>

<nav class= "border-gray-800 bg-slate-900  text-slate-700 font-semibold text-xs sm:text-sm leading-6">
    <div class="max-w-screen-xl flex flex-col sm:flex-row items-center justify-between mx-auto p-4">
      <a href="/" class="" use:link aria-label="Home page">
            <div class="flex flex-row">
                <div class="w-6 h-6 sm:w-10 sm:h-10 ">
                    <AppIcon class="text-white"/>
                </div>
                <span class="ml-4 text-2xl sm:text-4xl font-bold text-slate-200">TILOS</span>
            </div>
      </a>
       <div class="px-4 w-full block sm:w-auto">
            <ul class="flex flex-row pt-3  items-center justify-between mx-auto space-x-2 sm:space-x-12 mt-0 border-0 border-gray-700">
                {#if main}
                    <NotAuthorized>
                        <li><a class="block  rounded md:bg-transparent p-0  text-slate-200 hover:text-indigo-300" use:link href="/thome">Community</a></li>
                    </NotAuthorized>
                    <NotAuthorized>
                        <li><a class="block rounded md:bg-transparent p-0 text-slate-200 hover:text-indigo-300" use:link href="/tdownload">Download</a></li>
                    </NotAuthorized>
                {:else}
                    <Authorized>
                        <li><a class="block  rounded md:bg-transparent p-0 text-slate-200 hover:text-indigo-300" use:link href='/thome'>Community</a></li>
                    </Authorized>
                {/if}
            </ul>
        </div>
    
    </div>
  </nav>
