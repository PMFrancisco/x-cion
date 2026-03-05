"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Bot,
  ImagePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getInitials, validateUsername } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useNpcProfiles, useCreateNpc, useUpdateNpc, useDeleteNpc } from "@/hooks/use-npc-profiles";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import type { Profile } from "@/lib/types";

export default function NpcsPage() {
  const router = useRouter();
  const { possess, actingAs } = useAuth();
  const { data: npcs, isLoading } = useNpcProfiles();
  const createNpc = useCreateNpc();
  const updateNpc = useUpdateNpc();
  const deleteNpc = useDeleteNpc();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editNpc, setEditNpc] = useState<Profile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null);

  const filteredNpcs = npcs?.filter((npc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return npc.display_name?.toLowerCase().includes(q) || npc.username?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
        <div className="flex items-center gap-6 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">NPCs</h1>
            <p className="text-sm text-muted-foreground">{npcs?.length ?? 0} personajes</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-xcion-primary text-white hover:bg-xcion-primary-hover"
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" />
            Crear NPC
          </Button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar NPC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full bg-secondary pl-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-xcion-primary" />
        </div>
      ) : npcs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">No hay NPCs creados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea tu primer personaje para empezar a publicar como NPC
          </p>
        </div>
      ) : filteredNpcs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Sin resultados</p>
          <p className="text-sm text-muted-foreground mt-1">
            No se encontraron NPCs para &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredNpcs?.map((npc) => (
            <div key={npc.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={npc.avatar_url ?? undefined} />
                  <AvatarFallback>{getInitials(npc.display_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{npc.display_name}</span>
                    <Badge variant="outline" className="text-xs">
                      <Bot className="mr-1 h-3 w-3" />
                      NPC
                    </Badge>
                    {actingAs?.id === npc.id && (
                      <Badge className="text-xs bg-xcion-primary">Poseído</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{npc.username}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      possess(npc);
                      toast.success(`Actuando como @${npc.username}`);
                    }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Poseer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditNpc(npc)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirm(npc)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <NpcFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Crear NPC"
        onSubmit={async (data) => {
          await createNpc.mutateAsync(data);
          setCreateOpen(false);
          toast.success("NPC creado");
        }}
        isPending={createNpc.isPending}
      />

      {editNpc && (
        <NpcFormDialog
          open={!!editNpc}
          onOpenChange={(open) => !open && setEditNpc(null)}
          title="Editar NPC"
          initialData={editNpc}
          onSubmit={async (data) => {
            await updateNpc.mutateAsync({ id: editNpc.id, ...data });
            setEditNpc(null);
            toast.success("NPC actualizado");
          }}
          isPending={updateNpc.isPending}
        />
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar NPC</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar a <strong>@{deleteConfirm?.username}</strong>? Sus publicaciones también serán
            eliminadas. Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteNpc.isPending}
              onClick={async () => {
                if (!deleteConfirm) return;
                await deleteNpc.mutateAsync(deleteConfirm.id);
                setDeleteConfirm(null);
                toast.success("NPC eliminado");
              }}
            >
              {deleteNpc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NpcFormData {
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
}

interface NpcFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialData?: Profile;
  onSubmit: (data: NpcFormData) => Promise<void>;
  isPending: boolean;
}

function NpcFormDialog({
  open,
  onOpenChange,
  title,
  initialData,
  onSubmit,
  isPending,
}: NpcFormDialogProps) {
  const [username, setUsername] = useState(initialData?.username ?? "");
  const [displayName, setDisplayName] = useState(initialData?.display_name ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.avatar_url ?? null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usernameError = username ? validateUsername(username) : null;

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 512,
      useWebWorker: true,
    });
    setAvatarFile(compressed);

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(compressed);
  };

  const handleSubmit = async () => {
    if (!username.trim() || !displayName.trim()) return;
    if (usernameError) return;

    let avatarUrl = initialData?.avatar_url;

    if (avatarFile) {
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = avatarFile.name.split(".").pop();
        const path = `npc/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, avatarFile);
        if (error) throw error;
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrl;
      } catch {
        toast.error("Error al subir el avatar");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSubmit({
      username: username.trim(),
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      avatarUrl: avatarUrl ?? undefined,
    });

    if (!initialData) {
      setUsername("");
      setDisplayName("");
      setBio("");
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative shrink-0"
            >
              <Avatar className="h-16 w-16">
                {avatarPreview ? <AvatarImage src={avatarPreview} /> : null}
                <AvatarFallback>
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <ImagePlus className="h-5 w-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <div className="flex-1 space-y-2">
              <div>
                <Label htmlFor="npc-display-name">Nombre</Label>
                <Input
                  id="npc-display-name"
                  placeholder="Nombre del personaje"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="npc-username">Usuario</Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">@</span>
              <Input
                id="npc-username"
                placeholder="nombre_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
              />
            </div>
            {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
          </div>

          <div>
            <Label htmlFor="npc-bio">Biografía</Label>
            <Textarea
              id="npc-bio"
              placeholder="Descripción del personaje..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/160</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending || uploading || !username.trim() || !displayName.trim() || !!usernameError
            }
            className="bg-xcion-primary text-white hover:bg-xcion-primary-hover"
          >
            {(isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
