import { Param, ParamData } from './param';
import { Target } from './target';
import { Type } from './type';

export interface Return {
  readonly types: string[];
  readonly desc: string;
}

export interface MemberData extends Target {
  readonly dataTypes?: string[];
  readonly mixType?: string;
  readonly return?: Return;
  readonly staticLink?: boolean;
  readonly type?: string;
  readonly params?: ParamData[];
}

/**
 * Member class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.Member
 */
class Member extends Target {
  public _params: Param[];
  public _parentType: Type;
  public dataTypes: string[];
  public mixType: string;
  public return: Return;
  public staticLink: boolean;
  public type: string;

  public constructor(data: MemberData) {
    super();
    const self = this;

    const getSummary = (desc: string) => {
      let pos = desc.indexOf('.');

      if (pos > 100 || pos === -1) {
        pos = 100;
      }

      return desc.substr(0, pos);
    };

    for (const name in data) {
      if (data.hasOwnProperty(name)) {
        this[name] = data[name];
      }
    }

    this._params = [];
    if (data.params) {
      data.params.forEach((paramData) => {
        self.addParam(new Param(paramData));
      });
    }

    if (!this.summary) {
      this.summary = getSummary(this.desc);
    }
  }

  /**
   * Adds a new parameter to the member.
   *
   * @method addParam
   * @param {Param} param Parameter info instance.
   * @return {Param} Param info instance that got passed in.
   */
  public addParam(param: Param): Param {
    this._params.push(param);

    return param;
  }

  /**
   * Returns an array of parameters.
   *
   * @method getParams
   * @return {Array} Array of Param instances.
   */
  public getParams(): Param[] {
    return this._params;
  }

  /**
   * Returns true/false if the member is static.
   *
   * @method isStatic
   * @return {Boolean} Static state.
   */
  public isStatic(): boolean {
    return !!this.static;
  }

  public getParentType(): Type {
    return this._parentType;
  }

  /**
   * Serializes the Member as JSON.
   *
   * @method toJSON
   * @return {Object} JSON object.
   */
  public toJSON(): Record<string, any> {
    const json: Record<string, any> = {};

    for (const name in this) {
      if (typeof (this[name]) !== 'function' && name.indexOf('_') !== 0) {
        json[name] = this[name];
      }
    }

    json.params = [];
    this._params.forEach((param) => {
      json.params.push(param.toJSON());
    });

    return json;
  }

  public clone(): Member {
    const parentType = this._parentType;

    const clone = new Member(this.toJSON());
    clone._parentType = parentType;

    return clone;
  }
}

export {
  Member
};

