
<script lang="ts">
    import AppIcon from './appicon.svelte'
    import { link } from 'svelte-spa-router';
    import {Authorized, NotAuthorized, signInHRef, signOutHRef, signUpHRef } from '@humandialog/auth.svelte'
    
</script>

<nav class= "border-gray-800 bg-slate-900  text-slate-700 font-semibold text-xs sm:text-sm leading-6">
    <div class="max-w-screen-xl flex flex-col sm:flex-row items-center justify-between mx-auto p-4">
      <a href="/" class="" use:link aria-label="Home page">
            <div class="flex flex-row">
                <AppIcon class="block w-10 h-10"/>
                <span class="ml-4 mt-1 text-2xl font-normal text-slate-200">Octopus</span>
            </div>
      </a>
       <div class="px-4 w-full block sm:w-auto">
            <ul class="flex flex-row pt-3  items-center justify-between mx-auto space-x-2 sm:space-x-12 mt-0 border-0 border-gray-700">
                <!--li><a class="block  rounded md:bg-transparent p-0  dark:hover:text-indigo-400" use:link href="/doc/what-is-objectreef-tech-ak1">About</a></li-->
                <NotAuthorized>
                    <li><a class="block  rounded md:bg-transparent p-0  text-slate-200 hover:text-indigo-300" use:link href={$signInHRef}>Sign in</a></li>
                </NotAuthorized>
                <NotAuthorized>
                    <li><a class="block rounded md:bg-transparent p-0 text-slate-200 hover:text-indigo-300" use:link href={$signUpHRef}>Get started</a></li>
                </NotAuthorized>
                <Authorized>
                    <li><a class="block  rounded md:bg-transparent p-0 text-slate-200 hover:text-indigo-300" use:link href={$signOutHRef}>Sign out</a></li>
                </Authorized>
            </ul>
        </div>
    
    </div>
  </nav>
