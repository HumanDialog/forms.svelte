<script>
    import Layout from '$lib/desk.svelte'
    import {reef} from '@humandialog/auth.svelte'

    import Main from './main.svelte';
    import Navigator from './navigator.svelte';
       

    import {    FaRegCompass, FaUsers } from 'svelte-icons/fa'
	import { push } from 'svelte-spa-router';
  

    reef.configure( {   mode: 'disabled',
                        local:{
                            api:    "http://127.0.0.1:1996/",
                            users:
                            [
                                "alice@example.com",
                                "bob@example.com"
                            ]
                        }});

    const layout = {
                sidebar : {
                    'TOC': {
                        icon: FaRegCompass,
                        component: Navigator
                    }
                },
                mainContent : {
                    component: Main
                },
                mainToolbar : {
                    signin: true,
                    customOperations:[
                        {
                            caption: 'Members',
                            icon: FaUsers,
                            action: (focused) => { push('/members') }
                        }
                    ]
                },
                dark:
                {
                    optional: true,
                    default: false
                },
                operations:
                {
                    optional: false,
                    default: true
                }

    }


</script>

<Layout {layout}/>

