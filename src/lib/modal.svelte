<script lang="ts">
	import { afterUpdate, onMount, tick } from 'svelte';
	  import Icon from './components/icon.svelte'
    
    export let title :string = '';
    export let open :boolean = false;
    export let content :string = ''; 
    export let icon = undefined;

    export const OK = 0;
    export const OKCancel = 1;
    export const Custom = 2;
    export let mode = OKCancel; 

    export let ok_caption :string = 'OK';
    export let cancel_caption :string = 'Cancel'

    export let on_ok_callback :Function | undefined = undefined;
    export let on_cancel_callback :Function | undefined = undefined;

    export function show( on_close_callback :Function|undefined = undefined)
    {
        open = true;
        close_callback = on_close_callback;
    }

    let root;
    afterUpdate(
      async () =>
      {
          if(!!root)
          {
              let modal_root = document.getElementById("__hd_svelte_modal_root")
              if(!!modal_root && root.parentElement != modal_root)
              {
                await tick();
                modal_root.appendChild(root)
              }
          }
      }
    )

    let close_callback :Function | undefined  = undefined;


    function on_ok(event :MouseEvent)
    {
        //open = false;
        
        if(on_ok_callback)
            on_ok_callback();

        if(close_callback)
            close_callback('OK');
    }

    function on_cancel(event :MouseEvent)
    {
        open = false;

        if(on_cancel_callback)
            on_cancel_callback();

        if(close_callback)
            close_callback('Cancel');
    }

</script>

{#if open}
<div class="relative z-20" aria-labelledby="modal-title" role="dialog" aria-modal="true" bind:this={root}>
    <!--
      Background backdrop, show/hide based on modal state.
  
      Entering: "ease-out duration-300"
        From: "opacity-0"
        To: "opacity-100"
      Leaving: "ease-in duration-200"
        From: "opacity-100"
        To: "opacity-0"
    -->
    <div class="fixed w-screen h-screen inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
  
    <div class="fixed z-20 inset-0 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!--
          Modal panel, show/hide based on modal state.
  
          Entering: "ease-out duration-300"
            From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            To: "opacity-100 translate-y-0 sm:scale-100"
          Leaving: "ease-in duration-200"
            From: "opacity-100 translate-y-0 sm:scale-100"
            To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        -->
        <div class=" transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all 
                    sm:my-8 w-full sm:max-w-lg">
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                {#if icon}
                    <Icon component={icon} size={6} class="text-gray-700"/>
                {/if}
              </div>
              <div class="grow mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">{title}</h3>
                <div class="mt-2">
                    {#if content}
                        <p class="text-sm text-gray-500">{content}</p>
                    {:else}
                        <slot/>
                    {/if}
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {#if mode == OK}
                <button type="button" class="inline-flex w-full justify-center rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:ml-3 sm:w-auto"
                        on:click={on_ok}>
                        {ok_caption}</button>
            {:else if mode == OKCancel}
                <button type="button" class="inline-flex w-full justify-center rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:ml-3 sm:w-auto"
                        on:click={on_ok}>
                        {ok_caption}</button>
                <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        on:click={on_cancel}>
                        {cancel_caption}</button>
            {:else if mode == Custom}
                <slot name="footer"/>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  {/if}