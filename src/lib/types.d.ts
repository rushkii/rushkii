export interface Activity {
  entries: Entry[];
}

export interface Entry {
  id: string;
  author_id: string;
  author_type: number;
  content_type: number;
  traits: Trait[];
  extra: Extra;
  participants: string[];
  ended_at?: string;
  started_at?: string;
  signature: Signature;
  expires_at?: string;
}

export interface Trait {
  type: number;
  duration_seconds?: number;
  first_time?: boolean;
  resurrected_last_played?: string;
  streak_count_days?: number;
  trending?: number;
  is_live?: boolean;
}

export interface Extra {
  type: string;
  game_name?: string;
  activity_name?: string;
  application_id?: string;
  platform?: number;
  last_update?: string;
  entries?: ExtraEntry[];
}

export interface ExtraEntry {
  media: Media;
  verification_state: number;
  repeat_count: number;
}

export interface Media {
  type: string;
  provider: number;
  media_type: number;
  parent_title: string;
  title: string;
  image_url: string;
  artists: Artist[];
  external_id: string;
  external_parent_id: string;
}

export interface Artist {
  external_id: string;
  name: string;
}

export interface Signature {
  signature: string;
  kid: string;
  version: number;
}

export interface ApplicationInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  summary: string;
  type: number;
  is_monetized: boolean;
  is_verified: boolean;
  is_discoverable: boolean;
  third_party_skus: ThirdPartySku[];
  bot: Bot;
  hook: boolean;
  executables: Executable[];
  storefront_available: boolean;
  bot_public: boolean;
  bot_require_code_grant: boolean;
  integration_types_config: {
    "0": Record<string, unknown>;
  };
  verify_key: string;
  flags: number;
}

export interface ThirdPartySku {
  id: string;
  sku: string;
  distributor: string;
}

export interface Bot {
  id: string;
  username: string;
  global_name: any;
  avatar: string;
  avatar_decoration_data: any;
  collectibles: any;
  discriminator: string;
  public_flags: number;
  primary_guild: any;
  clan: any;
  bot: boolean;
  banner: any;
  banner_color: any;
  accent_color: any;
}

export interface Executable {
  os: string;
  name: string;
  is_launcher: boolean;
}
