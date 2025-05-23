export interface BaseRepositoryInterface<T, ID, CreateDTO, UpdateDTO> {
  create(data: CreateDTO): Promise<T>;
  findAll(): Promise<T[]>;
  findOne(id: ID): Promise<T | null>;
  update(id: ID, data: UpdateDTO): Promise<T>;
  remove(id: ID): Promise<T>;
  exists(id: ID): Promise<boolean>;
}
