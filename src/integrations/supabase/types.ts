export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chamadoanexo: {
        Row: {
          caminho_servidor: string
          data_upload: string | null
          id_anexo: number
          id_chamado: number
          mime_type: string | null
          nome_original: string
        }
        Insert: {
          caminho_servidor: string
          data_upload?: string | null
          id_anexo?: number
          id_chamado: number
          mime_type?: string | null
          nome_original: string
        }
        Update: {
          caminho_servidor?: string
          data_upload?: string | null
          id_anexo?: number
          id_chamado?: number
          mime_type?: string | null
          nome_original?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chamado_anexo"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id_chamado"]
          },
        ]
      }
      chamados: {
        Row: {
          data_abertura: string | null
          data_fechamento: string | null
          descricao: string
          id_atendente: number | null
          id_chamado: number
          id_filial: number
          id_setor: number
          id_solicitante: number
          prioridade: string
          status_chamado: string
          titulo: string
        }
        Insert: {
          data_abertura?: string | null
          data_fechamento?: string | null
          descricao: string
          id_atendente?: number | null
          id_chamado?: number
          id_filial: number
          id_setor: number
          id_solicitante: number
          prioridade: string
          status_chamado: string
          titulo: string
        }
        Update: {
          data_abertura?: string | null
          data_fechamento?: string | null
          descricao?: string
          id_atendente?: number | null
          id_chamado?: number
          id_filial?: number
          id_setor?: number
          id_solicitante?: number
          prioridade?: string
          status_chamado?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chamados_atendente"
            columns: ["id_atendente"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "fk_chamados_filial"
            columns: ["id_filial"]
            isOneToOne: false
            referencedRelation: "filial"
            referencedColumns: ["id_filial"]
          },
          {
            foreignKeyName: "fk_chamados_setor"
            columns: ["id_setor"]
            isOneToOne: false
            referencedRelation: "setor"
            referencedColumns: ["id_setor"]
          },
          {
            foreignKeyName: "fk_chamados_solicitante"
            columns: ["id_solicitante"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      filial: {
        Row: {
          endereco: string | null
          id_filial: number
          nome_filial: string
        }
        Insert: {
          endereco?: string | null
          id_filial?: number
          nome_filial: string
        }
        Update: {
          endereco?: string | null
          id_filial?: number
          nome_filial?: string
        }
        Relationships: []
      }
      interacao: {
        Row: {
          conteudo: string
          data_interacao: string | null
          id_chamado: number
          id_interacao: number
          id_usuario: number
          tipo_interacao: string
        }
        Insert: {
          conteudo: string
          data_interacao?: string | null
          id_chamado: number
          id_interacao?: number
          id_usuario: number
          tipo_interacao: string
        }
        Update: {
          conteudo?: string
          data_interacao?: string | null
          id_chamado?: number
          id_interacao?: number
          id_usuario?: number
          tipo_interacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_interacao_chamado"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "fk_interacao_usuario"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      setor: {
        Row: {
          id_setor: number
          nome_setor: string
        }
        Insert: {
          id_setor?: number
          nome_setor: string
        }
        Update: {
          id_setor?: number
          nome_setor?: string
        }
        Relationships: []
      }
      usuario: {
        Row: {
          ativo: boolean
          data_cadastro: string | null
          email: string
          id_filial: number
          id_usuario: number
          nome: string
          senha_hash: string
          tipo_usuario: string
        }
        Insert: {
          ativo?: boolean
          data_cadastro?: string | null
          email: string
          id_filial: number
          id_usuario?: number
          nome: string
          senha_hash: string
          tipo_usuario: string
        }
        Update: {
          ativo?: boolean
          data_cadastro?: string | null
          email?: string
          id_filial?: number
          id_usuario?: number
          nome?: string
          senha_hash?: string
          tipo_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_filial"
            columns: ["id_filial"]
            isOneToOne: false
            referencedRelation: "filial"
            referencedColumns: ["id_filial"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
