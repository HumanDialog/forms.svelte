<script>
    import Layout from '$lib/desk.svelte'
    import {reef} from '@humandialog/auth.svelte'

    import TaskList from './tasklist.svelte';
    import MyTasks from './mytasks.svelte';
    import Nav from './nav.svelte'
    import AppIcon from './appicon.svelte'
    

    import {    FaRegCompass, 
                FaSearch, 
                FaDatabase} from 'svelte-icons/fa'
	import Tasklist from './tasklist.svelte';

   

    reef.configure( {
            mode: 'local',
            local: {
                api:    "http://127.0.0.1:1996/",
                //api:    "http://192.168.0.102:1996/",
                users:
                [
                    "alice@example.com",
                    "bob@example.com"
                ],
                apiVersion: "v001"}
            });

    const layout = {
                sidebar : {
                    'TOC': {
                        icon: AppIcon,
                        component: Nav
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: MyTasks},
                        '/tasklist':    { component: TaskList},
                        '/tasklist/*':  { component: TaskList},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks }
                    }
                },
                mainToolbar : {
                    signin: true
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

    }





</script>

<Layout {layout}/>

