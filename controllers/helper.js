
const getter = (target, prop) =>{
    if(typeof target[prop] === 'function') {
        return (...args)=>target[prop].call(target, ...args)
    }
    return target[prop]
}

const proxify = target =>{
    return new Proxy(target, {get: getter})
}

module.exports = { proxify }