<script lang="ts">
    import { afterUpdate, onMount, tick } from 'svelte';
    import Obfuscator from '../landing/email.obfuscator.svelte'
	import {Page, dark_mode_store} from '$lib';
    import {FaPaperPlane} from 'svelte-icons/fa'
    import {link} from 'svelte-spa-router'

    let captcha_element;
    let name;
    let email;
    let subject;
    let content;

    let err_msg = ''
    let success_msg = ''

    let show_spinner :boolean = false;

    const privacy = __PRIVACY_PAGE__
    const terms = __TERMS_PAGE__

    onMount(() => {
            setTimeout( () =>
            {
                if(grecaptcha && captcha_element)
                {
                    let theme :string = $dark_mode_store == 'dark' ? 'dark' : 'light'; 
                    grecaptcha.render(captcha_element, { 'sitekey' : '6Ld2OecnAAAAADonx1RLLbb1EdWC1kndQCsuht30', 'theme':theme });
                }
            }, 1000)
        })

    function validate_data() :boolean
    {
        if(!email)
        {
            err_msg = "E-mail address is empty";
            return false;
        }

        if(!is_valid_email_address(email))
        {
            err_msg = "The e-mail address appears to be incorrect"
            return false;
        }

        if(!content)
        {
            err_msg = "Type the content of your message"
            return false;
        }


        return true;
    }

    function is_valid_email_address(e: string): boolean 
    {
        //let pattern =
        //    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        //return (e.match(pattern) != null);
       
        const at_idx = e.indexOf("@"); 
        const dot_idx = e.lastIndexOf("."); 
        const space_idx = e.indexOf(" "); 

        if ((at_idx != -1) && 
            (at_idx != 0) && 
            (dot_idx != -1) && 
            (dot_idx != 0) && 
            (dot_idx > at_idx + 1) && 
            (e.length > dot_idx + 1) && 
            (space_idx == -1)) 
        { 
            return true; 
        } 
        else 
        { 
            return false; 
        } 
    }

    async function submit() 
    {
        if(!validate_data())
            return;

        let captcha_token = grecaptcha?.getResponse();

        let request = {
            subject: 'Tilos: ' + subject,
            content: content,
            name: name,
            email: email,
            captcha: captcha_token
        }    

        show_spinner = true;
        try {
            let res = await fetch('https://7vulys0yse.execute-api.eu-central-1.amazonaws.com/website-contact-form', {
                method: 'post',
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }),
                body: JSON.stringify(request)
            })
            if (res.ok) 
            {
                name = ''
                email = ''
                subject = ''
                content = ''

                const result = await res.json()
                success_msg = result.result;
                err_msg = '';
            }
            else 
            {
                console.error(res);

                const result = await res.json()
                err_msg = result.result;
                success_msg = ''
            }
        } catch (err) {
            console.error(err);
            err_msg = err.toString();
            success_msg = ''
        }

        show_spinner = false;
    }

    function getPageOperations()
    {
        return []
    }

</script>

<svelte:head>
    <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
    <title>Contact | {__APP_TITLE__}</title>
</svelte:head>

<Page   self={{}} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title="Contact">


    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
            <h1>
                Contact us
            </h1>

            <p class="lead">
                Contact us about any issue via email or contact form
            </p>

            <h2>E-mail support</h2>
            <p>
                e-mail:
                    <Obfuscator email="tilossupport@humandialog.com.pl"/>
                <!--    <span><span>&#x0069;</span><span>&#x006e;</span><span>&#x0066;</span><span>&#x006f;</span></span><span><span>&#x0040;</span><span>&#x0068;</span><span>&#x0075;</span><span>&#x006d;</span><span>&#x0061;</span><span>&#x006e;</span><span>&#x0064;</span><span>&#x0069;</span><span>&#x0061;</span><span>&#x006c;</span><span>&#x006f;</span><span>&#x0067;</span></span><span>&#x002e;</span><span>&#x0063;</span><span>&#x006f;</span><span>&#x006d;</span><span>&#x002e;</span><span><span>&#x0070;</span><span>&#x006c;</span></span>
                -->
            </p>

            <h2>Contact form</h2>
            <div class="sm:w-[480px] flex flex-col gap-3">
                <section class="sm:w-full flex flex-col sm:flex-row gap-3">
                    <input  placeholder="Name" 
                            bind:value={name}
                            class=" flex-1
                                    h-10 
                                    bg-stone-50 dark:bg-stone-700/50
                                    border border-stone-300 rounded-lg dark:border-stone-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500
                                    text-stone-900 dark:text-white dark:placeholder-stone-400
                                    text-sm  
                                    block
                                    p-2.5 ">
                    <input type="email" placeholder="E-mail address" 
                            bind:value={email}
                            class=" flex-1
                                    h-10 
                                    bg-stone-50 dark:bg-stone-700/50
                                    border border-stone-300 rounded-lg dark:border-stone-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500
                                    text-stone-900 dark:text-white dark:placeholder-stone-400
                                    text-sm
                                    block  
                                    p-2.5 ">
                </section>
                <input  placeholder="Subject" 
                        bind:value={subject}
                        class=" h-10 
                                bg-stone-50 dark:bg-stone-700/50
                                border border-stone-300 rounded-lg dark:border-stone-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500
                                text-stone-900 dark:text-white dark:placeholder-stone-400
                                text-sm  
                                block
                                p-2.5 ">
                <textarea  placeholder="Your message" 
                        bind:value={content}
                        class=" h-40 
                                bg-stone-50 dark:bg-stone-700/50
                                border border-stone-300 rounded-lg dark:border-stone-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500
                                text-stone-900 dark:text-white dark:placeholder-stone-400
                                text-sm  
                                block
                                p-2.5 "/>
                
                <div bind:this={captcha_element} class="ml-auto h-[78px]"></div>

                <p class="text-sm text-stone-600  dark:text-stone-400 text-right">
                    By clicking <span class="font-semibold">Submit</span> you agree with our <a href={privacy} use:link class="underline">Privacy Policy</a>.
                </p>
                <button type="button" 
                        class=" block h-10 w-30 ml-auto
                        py-2.5 px-4 
                        text-sm  
                        hover:bg-stone-200 dark:hover:bg-stone-800 
                        border border-stone-300 focus:outline-none dark:border-stone-600
                        flex items-center rounded"
                        disabled={show_spinner}
                        on:click={submit}>
                    {#if !show_spinner}
                        <div class="w-5 h-5 mr-1"><FaPaperPlane/></div>
                        <span class="ml-1">Submit</span>
                    {:else}
                        <div role="status" class="w-full">
                            <svg aria-hidden="true" class="w-5 h-5  text-stone-800 animate-spin dark:text-stone-400 fill-stone-200 dark:fill-stone-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            <span class="sr-only">Sending...</span>
                        </div>
                    {/if}
                </button>

                {#if err_msg}
                    <p class="text-sm text-red-600 text-right">{err_msg}</p>
                {/if}
                {#if success_msg}
                    <p class="text-sm text-green-600 text-right">{success_msg}</p>
                {/if}
                    
            </div>

            <h2>Headquarter</h2>
            <p>
                <span class="font-bold">Human Dialog S.A.</span><br>
                Kazimierza Wielkiego 27<br>
                50-077 Wrocław, Poland
            </p>
            <p>
                KRS: 0000601130<br>
                REGON: 363202202<br>
                D-U-N-S: 437056796
            </p>

        </article>
    </section>
    
</Page>

