<script lang="ts">
	import { afterUpdate, onMount, tick } from 'svelte';
	  import Icon from './components/icon.svelte'
    import {pushToolsActionsOperations, popToolsActionsOperations, fabHiddenDueToPopup} from './stores.js'
    import {isDeviceSmallerThan} from './utils'
    import {FaTimes} from 'svelte-icons/fa'
    import {i18n} from './i18n.js'
    
    export let open :boolean = false;
    
    export function show( on_close_callback :Function|undefined = undefined)
    {
        open = true;
        close_callback = on_close_callback;

        if(isDeviceSmallerThan("sm"))
        {  
            $fabHiddenDueToPopup = true  

          /*pushToolsActionsOperations( {
                opver: 1,
                operations: [
                    {
                        caption: 'Modal',
                        operations: [
                            {
                                icon: FaTimes,
                                action: (f) => { on_cancel(undefined); },
                                fab: 'M00',
                                tbr: 'A'
                            }
                        ]
                    }
                ]
            })*/
        }
    }

    export function hide()
    {
      if(!open)
        return;

      open = false;
      //popToolsActionsOperations()
      $fabHiddenDueToPopup = false
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

</script>

{#if open}
<div class="relative z-30" aria-labelledby="modal-title" role="dialog" aria-modal="true" bind:this={root}>
    <div class="fixed w-screen h-screen inset-0 bg-stone-500 dark:bg-stone-800 bg-opacity-75 dark:bg-opacity-75 transition-opacity"></div>
  
    <div class="fixed z-30 inset-0 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-1 text-center sm:items-center sm:p-0">
        <div class=" p-2 bg-stone-100 dark:bg-stone-800 rounded-lg shadow-md shadow-stone-500 dark:shadow-black text-left shadow-xl transition-all  
                    sm:my-8 w-full sm:max-w-lg"> <!-- transform overflow-hidden -->
            <slot/>
        </div>
      </div>
    </div>
  </div>
  {/if}