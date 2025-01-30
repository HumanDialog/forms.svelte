<script lang="ts">
	import { afterUpdate, onMount, tick } from 'svelte';
	  import Icon from './components/icon.svelte'
    
    export let title :string = '';
    export let open :boolean = false;
    export let content :string = ''; 
    export let icon = undefined;

    export const OK = 0;
    export const OKCancel = 1;
    export const Cancel = 2;
    export const Custom = 3;
    export let mode = OKCancel; 

    export let okCaption :string = 'OK';
    export let cancelCaption :string = 'Cancel'

    export let onOkCallback :Function | undefined = undefined;
    export let onCancelCallback :Function | undefined = undefined;

    export function show( on_close_callback :Function|undefined = undefined)
    {
        open = true;
        close_callback = on_close_callback;
    }

    export function hide()
    {
        open = false;
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
        
        if(onOkCallback)
            onOkCallback();

        if(close_callback)
            close_callback('OK');
    }

    function on_cancel(event :MouseEvent)
    {
        open = false;

        if(onCancelCallback)
            onCancelCallback();

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
    <div class="fixed w-screen h-screen inset-0 bg-stone-500 dark:bg-stone-800 bg-opacity-75 dark:bg-opacity-75 transition-opacity"></div>
  
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
        <div class=" transform overflow-hidden rounded-lg bg-white dark:bg-stone-700 text-left shadow-xl transition-all 
                    sm:my-8 w-full sm:max-w-lg">
          <div class="bg-white dark:bg-stone-700 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                {#if icon}
                    <Icon component={icon} size={6} class="text-stone-700"/>
                {/if}
              </div>
              <div class="grow mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-stone-900 dark:text-stone-100" id="modal-title">{title}</h3>
                <div class="mt-2">
                    {#if content}
                        <p class="text-sm text-stone-500 dark:text-stone-300">{content}</p>
                    {:else}
                        <slot/>
                    {/if}
                </div>
              </div>
            </div>
          </div>
          <div class="bg-stone-50 dark:bg-stone-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {#if mode == OK}
                <button type="button" class="inline-flex w-full justify-center rounded-md bg-blue-700 dark:bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:ml-3 sm:w-auto"
                        on:click={on_ok}>
                        {okCaption}</button>
            {:else if mode == OKCancel}
                <button type="button" class="inline-flex w-full justify-center rounded-md bg-blue-700 dark:bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:ml-3 sm:w-auto"
                        on:click={on_ok}>
                        {okCaption}</button>
                <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-stone-400 px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm  hover:bg-stone-50 sm:mt-0 sm:w-auto"
                        on:click={on_cancel}>
                        {cancelCaption}</button>
              {:else if mode == Cancel}
                  <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-stone-400 px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm  hover:bg-stone-50 sm:mt-0 sm:w-auto"
                          on:click={on_cancel}>
                          {cancelCaption}</button>
            {:else if mode == Custom}
              {#if $$slots.footer}
                <slot name="footer"/>
              {/if}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  {/if}