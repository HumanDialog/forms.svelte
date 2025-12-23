<script>
  import {editable} from '../utils'
  import {setjItemProperty} from '../updates.js'
  export let self;
  export let a=""
  //https://developer.chrome.com/docs/web-platform/page-lifecycle-api#the-unload-event
  //https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
  </script>


<span   use:editable={{
        action: (text) => setjItemProperty(self, a, text),
        onSingleChange: (text) => setjItemProperty(self, a, text),
        active: true
        }}
>{self[a]}</span>