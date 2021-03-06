
import * as Path from './path.js'
import focalStorage from './external/focalStorage.js'
import * as basefs from './fs/base.js'


/**
 * Global file system subsystem.
 *
 * Holds an manages mount points. Resolves paths to mountpoints and queries
 * mounted file systems.
 */
export class Filesystem {
  constructor() {
    this.mounts = new Map()
    this.reqcount = 0
  }

  mount(path, type, ...args) {
    path = Path.normalize(path)
    this.mounts.set(path, new type(path, ...args))
  }

  umount(path) {
    path = Path.normalize(path)
    this.mounts.delete(path)
  }

  async handle(request, url) {
    let path = Path.normalize(url.pathname),
      base = undefined,
      fs   = undefined

    for(let [mount, fsys] of this.mounts) {
      if(path.startsWith(mount) && (typeof base === 'undefined' || mount.length > base.length)) {
        fs   = fsys
        base = mount
      }
    }

    if(typeof base === 'undefined') {
      return new Response(null, {status: 400})
    }

    path = path.substring(base.length)

    this.reqcount++

    if(request.method === 'GET') {
      try {
        let read_resp = await fs.read(path, request)
        if (read_resp instanceof basefs.File)
          return read_resp.toResponse()
        return read_resp
      }
      catch (e) {
        if (e.name === 'IsDirectoryError') {
          return new Response(null, {
            status: 405,
            statusText: 'EISDIR',
            headers: {'Allow': 'OPTIONS'}
          })
        }

        // TODO: Do something with the information from the FileNotFoundError
        return new Response(null, {status: 405})
      }
    }

    if(request.method === 'PUT')
      return fs.write(path, request.text(), request)

    if(request.method === 'DELETE')
      return fs.del(path, request)

    if(request.method === 'MKCOL')
      return fs.makeDir(path, request)


    if(request.method === 'OPTIONS') {
      try {
        let stat_resp = await fs.stat(path, request)
        if (stat_resp instanceof basefs.Stat)
          return stat_resp.toResponse()
        return stat_resp
      }
      catch (e) {
        // TODO: Do something with the information from the StatNotFoundError
        return new Response(null, {status: 405})
      }
    }

    return new Response(null, {status: 400})
    // TODO: respond with 400 / 404?
  }

  mountsAsJso() {
    let jso = []
    for(let [path, mount] of this.mounts) {
      jso.push({
        path: path,
        name: mount.name,
        options: mount.options
      })
    }
    return jso
  }

  persistMounts() {
    var mounts = this.mountsAsJso()
    console.log("persist mounts: " + mounts)
    focalStorage.setItem("lively4mounts", mounts)
  }

  async loadMounts(){
    let mounts = await focalStorage.getItem("lively4mounts")

    if (!mounts) {
      return
    }

    try {
      for(let mount of mounts) {
        let fs = await System.import('/fs/' + mount.name + '.js')
        this.mount(mount.path, fs.default, mount.options)
      }
    } catch(e) {
      console.error(e)
    }
  }
}
