<script >
  import {editable} from '../utils'
  import {setjItemProperty} from '../updates.js'
  import Ricon from  './r.icon.svelte'
  import {getFormattedStringDate, getNiceStringDate, getNiceStringDateTime} from './date_utils.js'


  export let self = null;
  export let a="";
  export let readOnly = false;
  export let type = "date";


  let   value = null;
  let   pretty_value = "";

  if(!self[a])
      value = null;
  else
      value = new Date(self[a]);

  pretty_value = getNiceStringDate(value);
  let rValue = getFormattedStringDate(value, type);

  async function on_changed()
  {
    let svalue = ""
    if(rValue)
        svalue = "";
    else
    {
        let dvalue = new Date(rValue);
        svalue = dvalue.toISOString();
        pretty_value = getNiceStringDate(dvalue);
    }
    setjItemProperty(self, a, svalue);
 }

</script>


<div class="inline-block relative flex flex-row  items-center">
    <span class="mr-1">{pretty_value}</span>
    <Ricon icon = "chevron-down" size="xs"/>

    {#if !readOnly}
        {#if type == "datetime-local"}
            <input  type="datetime-local"
                    class="datepicker-input"
                    tabindex="-1"
                    on:change={on_changed}
                    bind:value={rValue}
                    >
        {:else}
            <input  type="date"
                    class="datepicker-input"
                    tabindex="-1"
                    on:change={on_changed}
                    bind:value={rValue}

                    on:blur={blur}>
        {/if}
    {/if}


</div>


<style>
    input:focus {
    outline: 0px solid transparent;
    }
    .datepicker-input{
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        box-sizing: border-box;
    }
    .datepicker-input::-webkit-calendar-picker-indicator {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        cursor: pointer;
    }
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>
