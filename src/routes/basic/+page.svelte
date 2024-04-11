<script>
    import Layout from '$lib/desk.svelte'
    import {reef} from '@humandialog/auth.svelte'

    import Nav from './nav.svelte'
    import AppIcon from './appicon.svelte'
    
	import Tasklist from './tasklist.svelte';
    import Task from './task.svelte'
    import Board from './list.board.svelte';

   

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
                        '/' :           { component: Tasklist},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*' :  { component: Board}
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


    

Array.prototype.insert_at = function(index, element)
{
    this.splice(index, 0, element);
    return this;
}

Array.prototype.insert_after = function(after, element)
{
    let after_idx = this.findIndex((t) => t == after);

    if(after_idx == this.length - 1)
    {
        this.push(element)
    }
    else
    {
        this.insert_at(after_idx+1, element)
    }
    
    return this;
}

Array.prototype.prev = function(element)
{
    let idx = this.findIndex((t) => t == element);
    if(idx < 1)
        return null;
    else
        return this[idx-1];
}

Array.prototype.next = function(element)
{
    let idx = this.findIndex((t) => t == element);
    if(idx >= this.length-1)
        return null;
    else
        return this[idx+1];
}

Array.prototype.remove_at = function(index)
{
    this.splice(index, 1)
    return this;
}

Array.prototype.remove = function(element)
{
    let idx = this.findIndex((t) => t == element);
    this.remove_at(idx);
    return this;
}

Array.prototype.swap = function(e1, e2)
{
    let idx1 = this.findIndex((t) => t == e1);
    let idx2 = this.findIndex((t) => t == e2);

    this[idx1] = e2;
    this[idx2] = e1;

    return this;
}



</script>

<Layout {layout}/>

