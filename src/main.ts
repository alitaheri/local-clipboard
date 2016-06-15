const ls = require('local-storage');

export interface ClipboardData {
  content: any;
  type?: string;
  description?: string;
  metadata?: any;
}

export interface ClipboardOptions {
  type?: string;
  description?: string;
  metadata?: any;
}

export interface Listener {
  (value: ClipboardData, old: ClipboardData, url: string): void;
}

const CLIPBOARD_KEY = 'LOCAL_CLIPBOARD';

const localListeners: Listener[] = [];

export function addLocalListener(listener: Listener) {
  if (typeof listener === 'function') {
    localListeners.push(listener);
  }
}

export function removeLocalListener(listener: Listener) {
  if (typeof listener === 'function') {
    const index = localListeners.indexOf(listener);
    if (index !== -1) {
      localListeners.splice(index, 1);
    }
  }
}

export function copy(data: any, options?: ClipboardOptions): void {
  const payload: ClipboardData = { content: data };

  if (options) {
    if (options.description) {
      payload.description = options.description;
    }

    if (options.type) {
      payload.type = options.type;
    }

    if (options.metadata) {
      payload.metadata = options.metadata;
    }
  }

  if (localListeners.length > 0) {
    const old = ls.get(CLIPBOARD_KEY);
    const url = (window && window.location && window.location.href) || null;

    localListeners.forEach(l => l(payload, old, url));
  }

  ls.set(CLIPBOARD_KEY, payload);
}

export function hasData(): boolean {
  const data = ls.get(CLIPBOARD_KEY) as ClipboardData;
  return data && 'content' in data;
}

export function getType(): string {
  const data = ls.get(CLIPBOARD_KEY) as ClipboardData;
  if (data && data.type) {
    return data.type;
  }
}

export function getDescription(): string {
  const data = ls.get(CLIPBOARD_KEY) as ClipboardData;
  if (data && data.description) {
    return data.description;
  }
}

export function getMetadata(): any {
  const data = ls.get(CLIPBOARD_KEY) as ClipboardData;
  if (data && data.metadata) {
    return data.metadata;
  }
}

export function paste(): any {
  const data = ls.get(CLIPBOARD_KEY) as ClipboardData;
  if (data && data.content) {
    return data.content;
  }
}

export function clear(): void {
  ls.remove(CLIPBOARD_KEY);
}

export function listen(listener: Listener): void {
  ls.on(CLIPBOARD_KEY, listener);
}

export function unlisten(listener: Listener): void {
  ls.off(CLIPBOARD_KEY, listener);
}

export function onCopy(method: string, prop: string, listenOnLocalChanges = false): any {
  return {
    propInjector: setProp => setProp(prop, ls.get(CLIPBOARD_KEY)),
    componentDidMountHook: (props, context, state, child) => {
      if (!child) {
        throw new Error('onCopy must be used on a class component.');
      }

      function copyListener(v, o, u) {
        child[method](v, o, u);
      }

      state.listener = copyListener;
      listen(copyListener);

      if (listenOnLocalChanges) {
        function localCopyListener(v, o, u) {
          child[method](v, o, u);
        }

        state.localListener = localCopyListener;
        addLocalListener(localCopyListener);
      }
    },
    componentWillUnmountHook: (props, context, state) => {
      unlisten(state.listener);

      if (listenOnLocalChanges) {
        removeLocalListener(state.localListener);
      }
    },
  };
}
