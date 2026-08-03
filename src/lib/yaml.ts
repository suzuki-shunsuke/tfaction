import { CORE_SCHEMA, load, mergeTag } from "js-yaml";

/**
 * js-yaml v5 changed the default schema of `load()` to CORE_SCHEMA, which
 * doesn't include the merge type (`!!merge`) anymore. Without it, YAML merge
 * keys (`<<: *anchor`) are kept as a literal `"<<"` key, and inherited fields
 * are silently dropped from the config.
 *
 * tfaction has supported merge keys since it depended on js-yaml v4, so we opt
 * back in explicitly. Note that we intentionally don't use YAML11_SCHEMA: it
 * would also change the int/float/boolean syntax, which js-yaml v4 didn't do.
 *
 * https://github.com/suzuki-shunsuke/tfaction/issues/4213
 * https://github.com/nodeca/js-yaml/blob/master/docs/migrate_v4_to_v5.md
 */
const schema = CORE_SCHEMA.withTags(mergeTag);

/**
 * Parse a YAML document, resolving merge keys (`<<`).
 * Use this instead of js-yaml's `load()` directly.
 */
export const loadYaml = (content: string): unknown => load(content, { schema });
