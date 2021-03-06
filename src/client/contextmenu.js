/*
 * Lively4 ContextMenu
 * - creates the "world menu" for Lively4
 */ 
  
import html from 'src/client/html.js';
import {pt} from 'lively.graphics';

export default class ContextMenu {
  
  constructor(target, optItems) {
    this.target = target;
    this.items = optItems;
  }
  
  openIn(container, evt, target, worldContext) {
     return ContextMenu.openIn(container, evt, target, worldContext,  this.items);
  }
  
  static hide() {
    if (this.menu) this.menu.remove();
    lively.removeEventListener("contextMenu",  document.documentElement);
  }
  
  static openComponentInWindow (name, evt) {
    this.hide();
    return lively.openComponentInWindow(name, pt(evt.pageX, evt.pageY));
  }
  
  static openInWindow(comp, evt) {
    var pos = lively.getPosition(comp);
	  lively.components.openInWindow(comp, pos).then( comp => {
	     lively.setPosition(comp, pt(0,0));
	  });
  }
  
  static targetMenuItems(target) {
    var wasEditable = (target.contentEditable == "true");
    var wasDisabled = (target.disabled == "true");
    var targetInWindow = target.parentElement.tagName == 'LIVELY-WINDOW';
    return [
      ["show", (evt) => {
         this.hide();
         lively.showElement(target);
      }],
      ["browse template source", (evt) => {
         this.hide();
         lively.showSource(target, evt);
      }],
      ["browse class source", (evt) => {
         this.hide();
         lively.showClassSource(target, evt);
      }],
      ["trace", (evt) => {
         System.import("src/client/tracer.js").then(tracer => {
           tracer.default.traceObject(target);
         });
         this.hide();
      }],
      [wasEditable ? "make uneditable" : "make editable", (evt) => {
         this.hide();
         target.contentEditable = !wasEditable;
      }],
      [wasDisabled ? "enable" : "disable", (evt) => {
         this.hide();
         target.disabled = !wasDisabled;
      }],
      [targetInWindow ? "strip window" : "open in window", (evt) => {
          this.hide();
          targetInWindow ?
            target.parentElement.embedContentInParent() :
            ContextMenu.openInWindow(target, evt);
        }]
    ];
  }
  
  static worldMenuItems(worldContext) {
    return  [
      ["Workspace", (evt) => {
        this.hide();
        lively.openWorkspace("", pt(evt.pageX, evt.pageY));
      }, "CMD+K"],
      ["Browser",     (evt) => {
        this.openComponentInWindow("lively-container", evt).then(comp => {
          var container = _.last(document.querySelectorAll("lively-container"));
          if (container)
            comp.followPath("" +container.getURL());
          else
            comp.followPath(lively4url +"/");
          comp.parentElement.style.width = "850px";
          comp.parentElement.style.height = "600px";
        });
      }, "CMD+B"],
      // ["File Editor",     (evt) => this.openComponentInWindow("lively-editor", evt)],
      // ["File Browser",    (evt) => this.openComponentInWindow("lively-file-browser", evt)],
      ["Mount",     (evt) => this.openComponentInWindow("lively-filesystems", evt)],
      ["Sync",     (evt) => this.openComponentInWindow("lively-sync", evt)],
      ["Services",     (evt) => this.openComponentInWindow("lively-services", evt)],
      // ["Terminal",        (evt) => this.openComponentInWindow("lively-terminal", evt)],
      // ["Console",         (evt) => this.openComponentInWindow("lively-console", evt)],
      ["File Search",         (evt) => this.openComponentInWindow("lively-search", evt)],
      ["TestRunner",         (evt) => this.openComponentInWindow("lively-testrunner", evt)],
      ["Component Bin",   (evt) => this.openComponentInWindow("lively-component-bin", evt),
       "CMD+O"],
      !document.webkitIsFullScreen ?
        ["Enter fullscreen", (evt) => 
          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)] :
          ["Cancel fullscreen", (evt) => 
          document.webkitCancelFullScreen()],
      ["Customize Page",   (evt) => {
        this.hide();
        lively.import("customize").then(c => c.openCustomizeWorkspace(evt));
      }],
      // #TODO use sub menues here
      ["Devdocs.io",     (evt) => {
        this.openComponentInWindow("lively-help",  pt(evt.pageX, evt.pageY));
      }, "CMD+H"],
      ["Wiki (Docs)",     (evt) => {
        this.openComponentInWindow("lively-container", evt).then(comp => {
          comp.followPath("https://lively-kernel.org/lively4/Lively4.wiki/Home.md");
      });
      }],
      ["Journal",     (evt) => {
        this.openComponentInWindow("lively-container", evt).then(comp => {
          comp.followPath("https://lively-kernel.org/lively4/Lively4.wiki/Journal.md");
      });
      }],
      ["Issues", (evt) => {
        window.open("https://github.com/LivelyKernel/lively4-core/issues") ;
      }],
      ["Text", (evt) => {
        var text  = document.createElement("p");
        text.innerHTML = "Hello";
        text.contentEditable = true;
        worldContext.appendChild(text);
        var pos = pt(evt.pageX, evt.pageY);
        if (worldContext.localizePosition) pos = worldContext.localizePosition(pos);

        lively.setPosition(text, pos);
        this.hide();
      }],
      ["Rectangle", (evt) => {
        var morph  = document.createElement("div");
        morph.style.width = "200px";
        morph.style.height = "100px";
        var pos = pt(evt.pageX, evt.pageY);
        if (worldContext.localizePosition) pos = worldContext.localizePosition(pos);
        lively.setPosition(morph, pos);
        // morph.style.backgroundColor = "blue";
        morph.style.backgroundColor = 'rgba(40,40,40,0.5)';
        worldContext.appendChild(morph);
        this.hide();
      }],
      ["save as ..", (evt) => {
        if (worldContext.onSaveAs)
          worldContext.onSaveAs() 
        else html.saveCurrentPageAs();
      }],
      ["save", (evt) => {
        if (worldContext.onSave)
          worldContext.onSave()
        else
          html.saveCurrentPage();
      }]
    ];
  }
  
  static items (target, worldContext) {
    if (!worldContext) worldContext = document.body;
    if (target) {
      return this.targetMenuItems(target);
    } else {
      return this.worldMenuItems(worldContext);
    }
  }
  
  static openIn(container, evt, target, worldContext, optItems) {
    this.hide();
    lively.addEventListener("contextMenu", document.documentElement, "click", () => {
      this.hide();
    }, true);

    var menu = lively.components.createComponent("lively-menu");
    return lively.components.openIn(container, menu).then(() => {
      if (this.menu) this.menu.remove()
      this.menu = menu;
      if (evt) {
        var xOffset = 0;
        var menuWidth = menu.clientWidth;
        var bodyWidth = $('body')[0].clientWidth;
        if (evt.pageX + menuWidth > bodyWidth) {
          xOffset = menuWidth;
        }
        lively.setPosition(menu, pt(evt.pageX - xOffset, evt.pageY));
      }
      menu.openOn(optItems || this.items(target, worldContext), evt).then(() => {
      });
      return menu;
    });
  }
}