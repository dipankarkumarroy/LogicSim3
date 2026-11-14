/**
 * Central registry mapping component type identifiers to their implementing classes.
 */
const ComponentRegistry = {
    _types: new Map(),

    /**
     * Registers one or more component type names to a component class.
     * @param {string|string[]} types
     * @param {typeof BaseComponent} ComponentClass
     */
    register(types, ComponentClass) {
        const typeList = Array.isArray(types) ? types : [types];
        typeList.forEach((type) => this._types.set(type, ComponentClass));
    },

    /**
     * Instantiates the registered component class for the given type.
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {string} id
     * @returns {BaseComponent}
     */
    create(type, x, y, id) {
        const ComponentClass = this._types.get(type);
        if (!ComponentClass) {
            console.warn(`Unknown component type "${type}", falling back to BaseComponent.`);
            return new BaseComponent(type, x, y, id);
        }
        return new ComponentClass(type, x, y, id);
    }
};

/**
 * Facade constructor preserving `new Component(type, x, y, id)` compatibility.
 */
class Component {
    constructor(type, x, y, id) {
        return ComponentRegistry.create(type, x, y, id);
    }
}
