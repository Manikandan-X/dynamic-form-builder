import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { FormFieldCreate, FormFieldResponse, FormResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { useToast } from "../../context/ToastContext";
import { FieldEditorCard, makeEmptyField, type FieldDraft } from "./FieldEditorCard";
import { SortableField } from "./SortableField";
import { tokens } from "../../theme";

function draftToPayload(field: FieldDraft): FormFieldCreate {
  return {
    client_key: field.client_key.trim(),
    label: field.label.trim(),
    field_type: field.field_type,
    placeholder: field.placeholder.trim() || null,
    help_text: field.help_text.trim() || null,
    is_required: field.is_required,
    display_order: field.display_order,
    min_length: field.min_length === "" ? null : Number(field.min_length),
    max_length: field.max_length === "" ? null : Number(field.max_length),
    min_value: field.min_value === "" ? null : Number(field.min_value),
    max_value: field.max_value === "" ? null : Number(field.max_value),
    is_conditional: field.is_conditional,
    conditional_field_key: field.is_conditional ? field.conditional_field_key || null : null,
    conditional_operator: field.is_conditional ? field.conditional_operator || null : null,
    conditional_value: field.is_conditional ? field.conditional_value || null : null,
    options: field.options.map((o, i) => ({ ...o, display_order: i + 1 })),
  };
}

function responseFieldToDraft(f: FormFieldResponse): FieldDraft {
  return {
    localId: crypto.randomUUID(),
    id: f.id,
    client_key: f.client_key,
    label: f.label,
    field_type: f.field_type,
    placeholder: f.placeholder ?? "",
    help_text: f.help_text ?? "",
    is_required: f.is_required,
    display_order: f.display_order,
    min_length: f.min_length?.toString() ?? "",
    max_length: f.max_length?.toString() ?? "",
    min_value: f.min_value?.toString() ?? "",
    max_value: f.max_value?.toString() ?? "",
    is_conditional: f.is_conditional,
    conditional_field_key: f.conditional_field_key ?? "",
    conditional_operator: f.conditional_operator ?? "",
    conditional_value: f.conditional_value ?? "",
    options: f.options.map((o) => ({ label: o.label, value: o.value, display_order: o.display_order })),
  };
}

interface MetaFormValues {
  title: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
}

export default function FormEditorPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { push } = useToast();

  const metaForm = useForm<MetaFormValues>({
    defaultValues: { title: "", description: "", is_active: true, is_public: false },
  });
  const { control, handleSubmit, reset, watch } = metaForm;
  const metaValues = watch();

  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [persistedIds, setPersistedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!isEdit) return;
    setIsLoading(true);
    api
      .get<FormResponseDto>(`/forms/${id}`)
      .then((res) => {
        reset({
          title: res.data.title,
          description: res.data.description ?? "",
          is_active: res.data.is_active,
          is_public: res.data.is_public,
        });
        const drafts = res.data.fields
          .slice()
          .sort((a, b) => a.display_order - b.display_order)
          .map(responseFieldToDraft);
        setFields(drafts);
        setPersistedIds(new Set(drafts.map((d) => d.localId)));
      })
      .catch((err) => setLoadError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const updateField = (localId: string, next: FieldDraft) =>
    setFields((prev) => prev.map((f) => (f.localId === localId ? next : f)));

  const removeFieldLocal = (localId: string) => setFields((prev) => prev.filter((f) => f.localId !== localId));

  const addField = () => {
    const nextOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.display_order)) + 1 : 1;
    const newField = makeEmptyField(nextOrder);
    setFields((prev) => [...prev, newField]);
  };

  const toggleCollapsed = (localId: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(localId)) next.delete(localId);
      else next.add(localId);
      return next;
    });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.localId === active.id);
      const newIndex = prev.findIndex((f) => f.localId === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((f, idx) => ({ ...f, display_order: idx + 1 }));
    });
    setOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    if (!isEdit) return;
    setIsSavingOrder(true);
    try {
      await Promise.all(
        fields
          .filter((f) => f.id)
          .map((f) => api.put(`/forms/${id}/fields/${f.id}`, { display_order: f.display_order })),
      );
      push("Field order saved.", "success");
      setOrderDirty(false);
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleRemoveField = async (field: FieldDraft) => {
    if (isEdit && field.id) {
      try {
        await api.delete(`/forms/${id}/fields/${field.id}`);
        removeFieldLocal(field.localId);
        push(`Removed field "${field.label}".`, "success");
      } catch (err) {
        push((normalizeError(err) as ApiError).message, "error");
      }
    } else {
      removeFieldLocal(field.localId);
    }
  };

  const handleSaveField = async (field: FieldDraft) => {
    if (!isEdit) return;
    setSavingFieldId(field.localId);
    try {
      const payload = draftToPayload(field);
      if (field.id) {
        const res = await api.put<FormFieldResponse>(`/forms/${id}/fields/${field.id}`, {
          label: payload.label,
          field_type: payload.field_type,
          placeholder: payload.placeholder,
          help_text: payload.help_text,
          is_required: payload.is_required,
          display_order: payload.display_order,
          min_length: payload.min_length,
          max_length: payload.max_length,
          min_value: payload.min_value,
          max_value: payload.max_value,
          is_conditional: payload.is_conditional,
          conditional_field_key: payload.conditional_field_key,
          conditional_operator: payload.conditional_operator,
          conditional_value: payload.conditional_value,
        });
        setFields((prev) =>
          prev.map((f) => (f.localId === field.localId ? { ...responseFieldToDraft(res.data), localId: f.localId } : f)),
        );
        push(`Saved "${payload.label}".`, "success");
      } else {
        const res = await api.post<FormFieldResponse>(`/forms/${id}/fields`, payload);
        const newDraft = { ...responseFieldToDraft(res.data), localId: field.localId };
        setFields((prev) => prev.map((f) => (f.localId === field.localId ? newDraft : f)));
        setPersistedIds((prev) => new Set(prev).add(field.localId));
        push(`Added field "${payload.label}".`, "success");
      }
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setSavingFieldId(null);
    }
  };

  const handleSaveMeta = handleSubmit(async (values) => {
    setIsSavingMeta(true);
    try {
      await api.put(`/forms/${id}`, {
        title: values.title,
        description: values.description || null,
        is_active: values.is_active,
        is_public: values.is_public,
      });
      push("Form details saved.", "success");
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsSavingMeta(false);
    }
  });

  const handleCreate = handleSubmit(async (values) => {
    setIsCreating(true);
    try {
      const res = await api.post<FormResponseDto>("/forms", {
        title: values.title,
        description: values.description || null,
        is_active: values.is_active,
        is_public: values.is_public,
        fields: fields.map(draftToPayload),
      });
      push(`"${res.data.title}" created.`, "success");
      navigate(`/forms/${res.data.id}`);
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsCreating(false);
    }
  });

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
    );
  }

  if (loadError) {
    return <EmptyState title="Couldn't load this form" description={loadError} />;
  }

  return (
    <Box>
      <PageHeader
        eyebrow={isEdit ? "Edit form" : "New form"}
        title={isEdit ? metaValues.title || "Edit form" : "Draft a new form"}
        description="Define the form details, then drag to reorder and configure fields below."
      />

      <Card sx={{ borderRadius: 2, p: 3, mb: 4 }}>
        <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
          Form details
        </Typography>
        <Stack spacing={2.5} sx={{ mt: 1.5 }}>
          <Controller
            name="title"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <TextField {...field} label="Title" required fullWidth placeholder="e.g. Employee onboarding" />}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => <TextField {...field} label="Description" fullWidth multiline minRows={2} placeholder="What is this form for?" />}
          />
          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2">Active</Typography>
                      <Typography variant="caption" sx={{ color: tokens.inkFaint }}>
                        Visible and available for submissions.
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2">Public</Typography>
                      <Typography variant="caption" sx={{ color: tokens.inkFaint }}>
                        Can be submitted without attributing a signed-in user.
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Stack>
          {isEdit && (
            <Box>
              <Button variant="outlined" onClick={handleSaveMeta} disabled={isSavingMeta} type="button">
                Save details
              </Button>
            </Box>
          )}
        </Stack>
      </Card>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
          Fields ({fields.length}) — drag to reorder
        </Typography>
        <Stack direction="row" spacing={1}>
          {isEdit && orderDirty && (
            <Button size="small" variant="contained" onClick={handleSaveOrder} disabled={isSavingOrder} type="button">
              Save order
            </Button>
          )}
          <Button size="small" variant="outlined" onClick={addField} type="button">
            + Add field
          </Button>
        </Stack>
      </Stack>

      {fields.length === 0 ? (
        <EmptyState title="No fields yet" description="Add your first field to start building this form." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.localId)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1.5}>
              {fields.map((field, i) => (
                <SortableField key={field.localId} id={field.localId}>
                  {(dragHandleProps) => (
                    <FieldEditorCard
                      field={field}
                      index={i}
                      siblingKeys={fields.filter((f) => f.localId !== field.localId).map((f) => f.client_key).filter(Boolean)}
                      onChange={(next) => updateField(field.localId, next)}
                      onRemove={() => handleRemoveField(field)}
                      onSave={isEdit ? () => handleSaveField(field) : undefined}
                      isPersisted={isEdit && persistedIds.has(field.localId)}
                      isNewInEditMode={isEdit && !persistedIds.has(field.localId)}
                      isSaving={savingFieldId === field.localId}
                      collapsed={collapsedIds.has(field.localId)}
                      onToggleCollapsed={() => toggleCollapsed(field.localId)}
                      dragHandleProps={dragHandleProps}
                    />
                  )}
                </SortableField>
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      {!isEdit && (
        <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${tokens.hairline}`, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" size="large" onClick={handleCreate} disabled={isCreating || !metaValues.title || fields.length === 0}>
            Create form
          </Button>
        </Box>
      )}
    </Box>
  );
}
