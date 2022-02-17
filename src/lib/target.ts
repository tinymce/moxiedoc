// A list of common properties that can be applied. See `tags.ts` for where
// these are patched into the relevant Member, Namespace or Type
class Target {
  public abstract?: boolean;
  public access?: string;
  public author?: string;
  public borrows?: string[];
  public default?: string;
  public dataType?: string;
  public deprecated?: string;
  public desc?: string;
  public extends?: string;
  public examples?: Array<{ content: string }>;
  public final?: boolean;
  public global?: boolean;
  public name?: string;
  public readonly?: boolean;
  public source?: { line: number; file: string };
  public see?: string;
  public since?: string;
  public static?: boolean;
  public summary?: string;
  public version?: string;
}

export {
  Target
};
