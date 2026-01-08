<script>
  import {editable, makeEditableIdFromFieldName} from '../utils'
  import {setjItemProperty} from '../updates.js'
	import { afterUpdate } from 'svelte';

  export let self
  export let a
  export let id = undefined
	export let readonly = false
	export let focusOnClick = true

  //https://developer.chrome.com/docs/web-platform/page-lifecycle-api#the-unload-event
  //https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event


	if(!id)
	{
			if(a)
				id = makeEditableIdFromFieldName(a)
	}

	const zeroWidthSpace = '\u200B'

	//if(!self[a])
	//		self[a] = "."


	function onChange(text)
	{
		if(text.startsWith(zeroWidthSpace))
			text = text.substring(zeroWidthSpace)

		if(text.endsWith(zeroWidthSpace))
			text = text.substring(0, text.length-1)

		text.trim()

		setjItemProperty(self, a, text)
	}

	function focus(e)
	{
		if(!self[a])
			self[a] = zeroWidthSpace
	}

	function blur(e)
	{

	}



</script>


<span   {id}
				use:editable={{
				action: onChange,
				onSingleChange: onChange,
				active: focusOnClick,
				readonly: readonly
				}}
				on:focus={focus}
				on:blur={blur}
>
	{self[a]}
</span>

<!--style>
	span:empty:focus::before {
  	content: ' ';
	}
</style-->