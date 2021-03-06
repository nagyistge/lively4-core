/*
 *
 */

import * as fs from './filesystem.js'
import * as msg from './messaging.js'

import sysfs from './fs/sys.js'
import httpfs from './fs/http.js'
import html5fs from './fs/html5.js'
import githubfs from './fs/github.js'
import dropboxfs from './fs/dropbox.js'

import focalStorage from './external/focalStorage.js';

const storagePrefix = "LivelySync_";

class ServiceWorker {
  constructor() {
    this.filesystem = new fs.Filesystem()

    // default file system
    this.filesystem.mount('/', githubfs, {repo: 'LivelyKernel/lively4-core', branch: 'gh-pages'})
    this.filesystem.mount('/sys', sysfs)
    this.filesystem.mount('/local', html5fs)

    this.filesystem.loadMounts();
    // here we should remount previous filesystem (remembered in focalStorage)
  }

  fetch(event) {
    let request = event.request;
    if (!request) return
    let  url   = new URL(request.url),
      promise = undefined

    if(url.hostname !== 'lively4') {
      if (url.hostname == location.hostname && request.mode != 'navigate') {
        if (url.pathname.match(/\/_git\//))  return;
        if (url.pathname.match(/\/_search\//))  return; 
        if (url.pathname.match(/\/_meta\//))  return; 
        if (url.pathname.match(/lively4-serviceworker/))  return; 
        
        
        try {                        
          event.respondWith(new Promise(async (resolve, reject) => {
            var email = await focalStorage.getItem(storagePrefix+ "githubEmail") 
            var username = await focalStorage.getItem(storagePrefix+ "githubUsername") 
            var token = await focalStorage.getItem(storagePrefix+ "githubToken")
            // console.log("email: " + email + " username: " + username + " token: " + token)
            // console.log("heimspiel: " + url);
             
             // we have to manually recreate a request, because you cannot modify the original
             // see http://stackoverflow.com/questions/35420980/how-to-alter-the-headers-of-a-request
             var options = {
                method: request.method,
                headers: new Headers(), 
                mode: request.mode,
                credentials: request.credentials,
                redirect: request.redirect 
            }
            if (request.method == "PUT") {
              options.body =  await request.text()
            }
            
            // if (request.url.toString().match("dummy")) {
            //   debugger
            // }
            // for(var ea of request.headers.entries()) {console.log(ea) }
              
            for (var pair of request.headers.entries()) {
              // console.log("set header " + pair[0] + " to" + pair[1])
              options.headers.set(pair[0], pair[1]);
            }
            options.headers.set("gitusername", username);
            options.headers.set("gitemail", email);
            options.headers.set("gitpassword", token);
             
            var req = new Request(request.url, options );
            
            // console.log("username: " + req.headers.get("gitusername"));
            
            // use system here to prevent recursion...
            resolve(self.fetch(req).then(result => {
              // console.log("got result!" + result)
              if(result instanceof Response) {
                return result
              } else {
                return new Response(result)
              }
            }).catch(e => {
              console.log("fetch error: "  + e)
              return new Response("Could not fetch " + url +", because of: " + e)
            })) 
          }))
        } catch(err) {
          if (err.toString().match("The fetch event has already been responded to.")) {
            console.log("How can we check for this before? ", err)
          } else {
            throw err
          }
        }
      } else {
        // do nothing should be fine...
        // event.respondWith(self.fetch(request));
      }
    } else {
      let response = this.filesystem.handle(request, url)

      response = response.then((result) => {
        if(result instanceof Response) {
          return result
        } if(result && result.toResponse) {
          return result.toResponse()
        } else {
          return new Response(result)
        }
      }).catch((err) => {
        console.error('Error while processing fetch event:', err)

        let message = err.toString()
        let content = JSON.stringify({message: message})

        return new Response(content, {status: 500, statusText: message})
      })

      event.respondWith(response)
    }
  }

  message(event) {
    return msg.process(event)
  }
}

/*
 * function to object adapter
 */

var __instance__
export function instance() {
  if(typeof __instance__ === 'undefined') {
    __instance__ = new ServiceWorker()
  }

  return __instance__
}

export function install() {
  return self.skipWaiting()
}

export function activate() {
  return self.clients.claim()
}

export function fetch(event) {
  return instance().fetch(event)
}

export function message(event) {
  return instance().message(event)
}


export {
  focalStorage
}

console.log("Loaded swx.js")
